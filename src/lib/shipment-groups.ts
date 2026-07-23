import type { ShipmentGroup } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import { parseAuctionRow } from "@/lib/parse-auction";
import { generateBundleReferenceNumber } from "@/lib/reference-number";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export interface ShipmentGroupOrderItem {
  auctionId: string;
  threadId: string;
  title: string;
  imageUrl: string | null;
  referenceNumber: string | null;
}

export interface PendingShipmentGroup {
  groupId: string;
  bundleReference: string;
  buyerWallet: string;
  orders: ShipmentGroupOrderItem[];
  urgencyAt: string | null;
}

function parseShipmentGroup(row: Record<string, unknown>): ShipmentGroup {
  return {
    id: row.id as string,
    bundle_reference: row.bundle_reference as string,
    seller_wallet: row.seller_wallet as string,
    buyer_wallet: row.buyer_wallet as string,
    tracking_courier: (row.tracking_courier as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

function hasTrackingValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function resolveEscrowStatus(
  threadEscrowStatus: string | null | undefined,
  auctionEscrowState: string | null | undefined
): string | null {
  return threadEscrowStatus ?? auctionEscrowState ?? null;
}

function hasOrderTracking(
  threadTracking: string | null | undefined,
  auctionTracking: string | null | undefined
): boolean {
  return hasTrackingValue(threadTracking) || hasTrackingValue(auctionTracking);
}

export async function fetchPendingShipmentGroups(
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<PendingShipmentGroup[]> {
  const { data: groupRows, error } = await client
    .from("shipment_groups")
    .select("id, bundle_reference, buyer_wallet, tracking_number, created_at")
    .eq("seller_wallet", sellerWallet)
    .is("tracking_number", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!groupRows?.length) return [];

  const groupIds = groupRows.map((row) => row.id as string);

  const { data: auctionRows, error: auctionError } = await client
    .from("auctions")
    .select(
      "id, title, image_url, reference_number, shipment_group_id, escrow_funded_at"
    )
    .in("shipment_group_id", groupIds);

  if (auctionError) throw auctionError;

  const auctionsByGroup = new Map<string, typeof auctionRows>();
  for (const row of auctionRows ?? []) {
    const groupId = row.shipment_group_id as string;
    const existing = auctionsByGroup.get(groupId) ?? [];
    existing.push(row);
    auctionsByGroup.set(groupId, existing);
  }

  const auctionIds = (auctionRows ?? []).map((row) => row.id as string);
  const threadMap = new Map<string, string>();

  if (auctionIds.length) {
    const { data: threadRows, error: threadError } = await client
      .from("message_threads")
      .select("id, auction_id")
      .in("auction_id", auctionIds)
      .eq("seller_wallet", sellerWallet)
      .eq("status", "active");

    if (threadError) throw threadError;

    for (const row of threadRows ?? []) {
      if (row.auction_id) {
        threadMap.set(row.auction_id as string, row.id as string);
      }
    }
  }

  const pendingGroups: PendingShipmentGroup[] = [];

  for (const row of groupRows) {
    const groupId = row.id as string;
    const groupAuctions = auctionsByGroup.get(groupId) ?? [];
    if (!groupAuctions.length) continue;

    const orders: ShipmentGroupOrderItem[] = groupAuctions.map((auctionRow) => ({
      auctionId: auctionRow.id as string,
      threadId: threadMap.get(auctionRow.id as string) ?? "",
      title: String(auctionRow.title ?? "").trim() || "Untitled Auction",
      imageUrl: (auctionRow.image_url as string | null) ?? null,
      referenceNumber: (auctionRow.reference_number as string | null) ?? null,
    }));

    const urgencyAt = groupAuctions.reduce<string | null>((earliest, auctionRow) => {
      const fundedAt = (auctionRow.escrow_funded_at as string | null) ?? null;
      if (!fundedAt) return earliest;
      if (!earliest) return fundedAt;
      return new Date(fundedAt).getTime() < new Date(earliest).getTime()
        ? fundedAt
        : earliest;
    }, null);

    pendingGroups.push({
      groupId,
      bundleReference: row.bundle_reference as string,
      buyerWallet: row.buyer_wallet as string,
      orders,
      urgencyAt,
    });
  }

  pendingGroups.sort((a, b) => {
    const aTime = a.urgencyAt
      ? new Date(a.urgencyAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bTime = b.urgencyAt
      ? new Date(b.urgencyAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  return pendingGroups;
}

export async function createShipmentGroup({
  sellerWallet,
  auctionIds,
  client = supabase,
}: {
  sellerWallet: string;
  auctionIds: string[];
  client?: SupabaseClient;
}): Promise<{ group: ShipmentGroup; auctionIds: string[] }> {
  const uniqueAuctionIds = [...new Set(auctionIds.map((id) => id.trim()).filter(Boolean))];

  if (uniqueAuctionIds.length < 2) {
    throw new Error("Select at least two orders to bundle.");
  }

  const { data: auctionRows, error: auctionError } = await client
    .from("auctions")
    .select(
      "id, seller_wallet, title, reference_number, escrow_state, tracking_number, shipment_group_id"
    )
    .in("id", uniqueAuctionIds);

  if (auctionError) throw auctionError;

  if ((auctionRows ?? []).length !== uniqueAuctionIds.length) {
    throw new Error("One or more selected orders could not be found.");
  }

  const { data: threadRows, error: threadError } = await client
    .from("message_threads")
    .select("id, auction_id, buyer_wallet, seller_wallet, escrow_status, tracking_number")
    .in("auction_id", uniqueAuctionIds)
    .eq("seller_wallet", sellerWallet)
    .eq("status", "active");

  if (threadError) throw threadError;

  const threadByAuction = new Map(
    (threadRows ?? []).map((row) => [row.auction_id as string, row])
  );

  let buyerWallet: string | null = null;

  for (const auctionRow of auctionRows ?? []) {
    const auction = parseAuctionRow(auctionRow as Record<string, unknown>);
    const threadRow = threadByAuction.get(auction.id);

    if (!threadRow) {
      throw new Error("Each selected order must have an active message thread.");
    }

    if (auction.seller_wallet !== sellerWallet) {
      throw new Error("You can only bundle your own orders.");
    }

    if (auction.shipment_group_id) {
      throw new Error("One or more selected orders are already bundled.");
    }

    const escrowStatus = resolveEscrowStatus(
      threadRow.escrow_status as string | null,
      auction.escrow_state
    );

    if (escrowStatus !== "funded") {
      throw new Error("Only paid orders waiting to ship can be bundled.");
    }

    if (
      hasOrderTracking(
        threadRow.tracking_number as string | null,
        auction.tracking_number
      )
    ) {
      throw new Error("One or more selected orders already have tracking.");
    }

    const threadBuyer = threadRow.buyer_wallet as string;
    if (!buyerWallet) {
      buyerWallet = threadBuyer;
    } else if (buyerWallet !== threadBuyer) {
      throw new Error("Bundled orders must belong to the same buyer.");
    }
  }

  if (!buyerWallet) {
    throw new Error("Unable to determine buyer for this bundle.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: groupRow, error: insertError } = await client
      .from("shipment_groups")
      .insert({
        bundle_reference: generateBundleReferenceNumber(),
        seller_wallet: sellerWallet,
        buyer_wallet: buyerWallet,
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        lastError = insertError;
        continue;
      }

      logSupabaseError("createShipmentGroup insert", insertError);
      throw new Error("Unable to create bundle. Please try again.");
    }

    const group = parseShipmentGroup(groupRow as Record<string, unknown>);

    const { data: updatedRows, error: updateError } = await client
      .from("auctions")
      .update({ shipment_group_id: group.id })
      .in("id", uniqueAuctionIds)
      .is("shipment_group_id", null)
      .select("id");

    if (updateError) {
      await client.from("shipment_groups").delete().eq("id", group.id);
      logSupabaseError("createShipmentGroup update auctions", updateError);
      throw new Error("Unable to link orders to bundle. Please try again.");
    }

    if ((updatedRows ?? []).length !== uniqueAuctionIds.length) {
      await client.from("shipment_groups").delete().eq("id", group.id);
      throw new Error(
        "One or more orders changed while bundling. Refresh and try again."
      );
    }

    return { group, auctionIds: uniqueAuctionIds };
  }

  logSupabaseError("createShipmentGroup", lastError);
  throw new Error("Unable to create bundle. Please try again.");
}
