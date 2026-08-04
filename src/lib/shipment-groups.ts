import type { ShipmentGroup } from "@/lib/database.types";
import { resolveShippingUsd } from "@/lib/auction-shipping";
import { getEscrowConnection } from "@/lib/escrow";
import { logSupabaseError } from "@/lib/errors";
import { notifyBundleRefundSent, notifyBundleShipped } from "@/lib/notifications";
import { parseAuctionRow } from "@/lib/parse-auction";
import { generateBundleReferenceNumber } from "@/lib/reference-number";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export const MIN_REFUND_NUDGE_SAVINGS_USD = 1;

export interface ShipmentGroupOrderItem {
  auctionId: string;
  threadId: string;
  title: string;
  imageUrl: string | null;
  referenceNumber: string | null;
  escrowPda: string | null;
  amountLamports: number;
  hasTracking: boolean;
}

export interface PendingShipmentGroup {
  groupId: string;
  bundleReference: string;
  buyerWallet: string;
  orders: ShipmentGroupOrderItem[];
  urgencyAt: string | null;
}

export interface BundleRefundNudge {
  groupId: string;
  bundleReference: string;
  buyerWallet: string;
  itemCount: number;
  estimatedSavingsUsd: number;
  threadId: string | null;
}

export interface BundleShippingSavingsEstimate {
  estimatedSavingsUsd: number;
  totalChargedUsd: number;
  shippedOnceUsd: number;
  perOrderShippingUsd: number[];
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
    refund_sent_at: (row.refund_sent_at as string | null) ?? null,
    refund_nudge_dismissed_at:
      (row.refund_nudge_dismissed_at as string | null) ?? null,
    refund_tx_signature: (row.refund_tx_signature as string | null) ?? null,
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
      "id, title, image_url, reference_number, shipment_group_id, escrow_funded_at, escrow_pda, escrow_amount_lamports, tracking_number"
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
  const threadMap = new Map<
    string,
    { id: string; tracking_number: string | null }
  >();

  if (auctionIds.length) {
    const { data: threadRows, error: threadError } = await client
      .from("message_threads")
      .select("id, auction_id, tracking_number")
      .in("auction_id", auctionIds)
      .eq("seller_wallet", sellerWallet)
      .eq("status", "active");

    if (threadError) throw threadError;

    for (const row of threadRows ?? []) {
      if (row.auction_id) {
        threadMap.set(row.auction_id as string, {
          id: row.id as string,
          tracking_number: (row.tracking_number as string | null) ?? null,
        });
      }
    }
  }

  const pendingGroups: PendingShipmentGroup[] = [];

  for (const row of groupRows) {
    const groupId = row.id as string;
    const groupAuctions = auctionsByGroup.get(groupId) ?? [];
    if (!groupAuctions.length) continue;

    const orders: ShipmentGroupOrderItem[] = groupAuctions.map((auctionRow) => {
      const auctionId = auctionRow.id as string;
      const thread = threadMap.get(auctionId);
      const auctionTracking = (auctionRow.tracking_number as string | null) ?? null;

      return {
        auctionId,
        threadId: thread?.id ?? "",
        title: String(auctionRow.title ?? "").trim() || "Untitled Auction",
        imageUrl: (auctionRow.image_url as string | null) ?? null,
        referenceNumber: (auctionRow.reference_number as string | null) ?? null,
        escrowPda: (auctionRow.escrow_pda as string | null) ?? null,
        amountLamports: Number(auctionRow.escrow_amount_lamports ?? 0),
        hasTracking: hasOrderTracking(thread?.tracking_number, auctionTracking),
      };
    });

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

export async function getBundleReferenceForAuction(
  auctionId: string,
  client: SupabaseClient = supabase
): Promise<string | null> {
  const { data: auctionRow, error: auctionError } = await client
    .from("auctions")
    .select("shipment_group_id")
    .eq("id", auctionId)
    .maybeSingle();

  if (auctionError) throw auctionError;

  const groupId = (auctionRow?.shipment_group_id as string | null) ?? null;
  if (!groupId) return null;

  const { data: groupRow, error: groupError } = await client
    .from("shipment_groups")
    .select("bundle_reference")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throw groupError;
  return (groupRow?.bundle_reference as string | null) ?? null;
}

export async function finalizeShipmentGroupTracking({
  groupId,
  sellerWallet,
  carrier,
  trackingNumber,
  client = supabase,
}: {
  groupId: string;
  sellerWallet: string;
  carrier: string;
  trackingNumber: string;
  client?: SupabaseClient;
}): Promise<ShipmentGroup> {
  const trimmedCarrier = carrier.trim();
  const trimmedTracking = trackingNumber.trim();

  if (!trimmedCarrier) throw new Error("Select a carrier.");
  if (!trimmedTracking) throw new Error("Enter a tracking number.");

  const { data: groupRow, error: groupError } = await client
    .from("shipment_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!groupRow) throw new Error("Bundle not found.");
  if (groupRow.seller_wallet !== sellerWallet) {
    throw new Error("Only the seller can finalize tracking for this bundle.");
  }
  if (hasTrackingValue(groupRow.tracking_number as string | null)) {
    throw new Error("Tracking has already been recorded for this bundle.");
  }

  const { data: auctionRows, error: auctionError } = await client
    .from("auctions")
    .select("id, title, tracking_number")
    .eq("shipment_group_id", groupId);

  if (auctionError) throw auctionError;
  if (!auctionRows?.length) {
    throw new Error("This bundle has no linked orders.");
  }

  const auctionIds = auctionRows.map((row) => row.id as string);
  const { data: threadRows, error: threadError } = await client
    .from("message_threads")
    .select("id, auction_id, tracking_number")
    .in("auction_id", auctionIds)
    .eq("seller_wallet", sellerWallet)
    .eq("status", "active");

  if (threadError) throw threadError;

  const threadByAuction = new Map(
    (threadRows ?? []).map((row) => [row.auction_id as string, row])
  );

  const missingTracking: string[] = [];

  for (const auctionRow of auctionRows) {
    const auctionId = auctionRow.id as string;
    const threadRow = threadByAuction.get(auctionId);
    const title = String(auctionRow.title ?? "").trim() || "Untitled Auction";

    if (
      !hasOrderTracking(
        threadRow?.tracking_number as string | null,
        auctionRow.tracking_number as string | null
      )
    ) {
      missingTracking.push(title);
    }
  }

  if (missingTracking.length > 0) {
    throw new Error(
      `Upload tracking for all bundled items first: ${missingTracking.join(", ")}`
    );
  }

  const { data: updatedGroup, error: updateError } = await client
    .from("shipment_groups")
    .update({
      tracking_courier: trimmedCarrier,
      tracking_number: trimmedTracking,
    })
    .eq("id", groupId)
    .is("tracking_number", null)
    .select("*")
    .single();

  if (updateError) {
    logSupabaseError("finalizeShipmentGroupTracking", updateError);
    throw new Error("Unable to save bundle tracking. Please try again.");
  }

  const group = parseShipmentGroup(updatedGroup as Record<string, unknown>);
  const firstThreadId = (threadRows ?? []).find((row) => row.id)?.id as
    | string
    | undefined;

  if (firstThreadId) {
    await notifyBundleShipped({
      buyerWallet: group.buyer_wallet,
      bundleReference: group.bundle_reference,
      courier: trimmedCarrier,
      trackingNumber: trimmedTracking,
      itemCount: auctionRows.length,
      threadId: firstThreadId,
      groupId: group.id,
      client,
    });
  }

  return group;
}

function resolveOrderShippingUsd({
  threadShippingUsd,
  threadShippingCountry,
  auction,
  sellerCountry,
  shipsInternationally,
}: {
  threadShippingUsd: number | null;
  threadShippingCountry: string | null;
  auction: {
    domestic_shipping_usd: number;
    international_shipping_usd: number;
    is_dummy?: boolean;
    seller_wallet?: string;
  };
  sellerCountry: string | null;
  shipsInternationally: boolean;
}): number {
  if (threadShippingUsd != null && Number.isFinite(threadShippingUsd)) {
    return Math.max(0, threadShippingUsd);
  }

  const resolved = resolveShippingUsd({
    domesticShippingUsd: auction.domestic_shipping_usd,
    internationalShippingUsd: auction.international_shipping_usd,
    sellerCountry,
    buyerCountry: threadShippingCountry,
    shipsInternationally,
    isExempt: Boolean(auction.is_dummy),
  });

  return Math.max(0, resolved ?? 0);
}

export function estimateBundleShippingSavings(
  perOrderShippingUsd: number[]
): BundleShippingSavingsEstimate {
  const normalized = perOrderShippingUsd.map((value) => Math.max(0, value));
  const totalChargedUsd = normalized.reduce((sum, value) => sum + value, 0);
  const shippedOnceUsd =
    normalized.length > 0 ? Math.max(...normalized) : 0;
  const estimatedSavingsUsd = Math.max(0, totalChargedUsd - shippedOnceUsd);

  return {
    estimatedSavingsUsd,
    totalChargedUsd,
    shippedOnceUsd,
    perOrderShippingUsd: normalized,
  };
}

function isBundleRefundNudgeEligible({
  group,
  auctionsComplete,
  estimatedSavingsUsd,
}: {
  group: ShipmentGroup;
  auctionsComplete: boolean;
  estimatedSavingsUsd: number;
}): boolean {
  return (
    hasTrackingValue(group.tracking_number) &&
    !group.refund_sent_at &&
    !group.refund_nudge_dismissed_at &&
    auctionsComplete &&
    estimatedSavingsUsd >= MIN_REFUND_NUDGE_SAVINGS_USD
  );
}

export async function fetchBundleRefundNudges(
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<BundleRefundNudge[]> {
  const { data: groupRows, error } = await client
    .from("shipment_groups")
    .select(
      "id, bundle_reference, buyer_wallet, tracking_number, refund_sent_at, refund_nudge_dismissed_at"
    )
    .eq("seller_wallet", sellerWallet)
    .not("tracking_number", "is", null)
    .is("refund_sent_at", null)
    .is("refund_nudge_dismissed_at", null);

  if (error) throw error;
  if (!groupRows?.length) return [];

  const groupIds = groupRows.map((row) => row.id as string);

  const { data: auctionRows, error: auctionError } = await client
    .from("auctions")
    .select(
      "id, shipment_group_id, escrow_state, domestic_shipping_usd, international_shipping_usd, is_dummy, seller_wallet"
    )
    .in("shipment_group_id", groupIds);

  if (auctionError) throw auctionError;
  if (!auctionRows?.length) return [];

  const auctionIds = auctionRows.map((row) => row.id as string);

  const [{ data: threadRows, error: threadError }, { data: sellerRow, error: sellerError }] =
    await Promise.all([
      client
        .from("message_threads")
        .select("id, auction_id, shipping_usd, shipping_country")
        .in("auction_id", auctionIds)
        .eq("seller_wallet", sellerWallet)
        .eq("status", "active"),
      client
        .from("users")
        .select("country, ships_internationally")
        .eq("wallet_address", sellerWallet)
        .maybeSingle(),
    ]);

  if (threadError) throw threadError;
  if (sellerError) throw sellerError;

  const sellerCountry = (sellerRow?.country as string | null) ?? null;
  const shipsInternationally = Boolean(sellerRow?.ships_internationally);

  const threadsByAuction = new Map(
    (threadRows ?? []).map((row) => [row.auction_id as string, row])
  );

  const auctionsByGroup = new Map<string, typeof auctionRows>();
  for (const row of auctionRows) {
    const groupId = row.shipment_group_id as string;
    const existing = auctionsByGroup.get(groupId) ?? [];
    existing.push(row);
    auctionsByGroup.set(groupId, existing);
  }

  const nudges: BundleRefundNudge[] = [];

  for (const row of groupRows) {
    const group = parseShipmentGroup(row as Record<string, unknown>);
    const groupAuctions = auctionsByGroup.get(group.id) ?? [];
    if (!groupAuctions.length) continue;

    const allComplete = groupAuctions.every(
      (auctionRow) => auctionRow.escrow_state === "complete"
    );
    if (!allComplete) continue;

    const perOrderShippingUsd = groupAuctions.map((auctionRow) => {
      const auction = parseAuctionRow(auctionRow as Record<string, unknown>);
      const thread = threadsByAuction.get(auction.id);

      return resolveOrderShippingUsd({
        threadShippingUsd:
          thread?.shipping_usd != null ? Number(thread.shipping_usd) : null,
        threadShippingCountry: (thread?.shipping_country as string | null) ?? null,
        auction,
        sellerCountry,
        shipsInternationally,
      });
    });

    const savings = estimateBundleShippingSavings(perOrderShippingUsd);
    if (
      !isBundleRefundNudgeEligible({
        group,
        auctionsComplete: true,
        estimatedSavingsUsd: savings.estimatedSavingsUsd,
      })
    ) {
      continue;
    }

    const firstThread = (threadRows ?? []).find((threadRow) =>
      groupAuctions.some(
        (auctionRow) => auctionRow.id === threadRow.auction_id
      )
    );

    nudges.push({
      groupId: group.id,
      bundleReference: group.bundle_reference,
      buyerWallet: group.buyer_wallet,
      itemCount: groupAuctions.length,
      estimatedSavingsUsd: savings.estimatedSavingsUsd,
      threadId: (firstThread?.id as string | undefined) ?? null,
    });
  }

  return nudges;
}

export async function dismissBundleRefundNudge({
  groupId,
  sellerWallet,
  client = supabase,
}: {
  groupId: string;
  sellerWallet: string;
  client?: SupabaseClient;
}): Promise<ShipmentGroup> {
  const { data: groupRow, error: groupError } = await client
    .from("shipment_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!groupRow) throw new Error("Bundle not found.");
  if (groupRow.seller_wallet !== sellerWallet) {
    throw new Error("Only the seller can dismiss this refund nudge.");
  }
  if (groupRow.refund_sent_at) {
    throw new Error("A refund has already been sent for this bundle.");
  }
  if (groupRow.refund_nudge_dismissed_at) {
    return parseShipmentGroup(groupRow as Record<string, unknown>);
  }

  const now = new Date().toISOString();
  const { data: updatedGroup, error: updateError } = await client
    .from("shipment_groups")
    .update({ refund_nudge_dismissed_at: now })
    .eq("id", groupId)
    .is("refund_sent_at", null)
    .is("refund_nudge_dismissed_at", null)
    .select("*")
    .single();

  if (updateError) {
    logSupabaseError("dismissBundleRefundNudge", updateError);
    throw new Error("Unable to dismiss refund nudge. Please try again.");
  }

  return parseShipmentGroup(updatedGroup as Record<string, unknown>);
}

async function verifyRefundTransaction({
  txSignature,
  sellerWallet,
  buyerWallet,
  solAmount,
}: {
  txSignature: string;
  sellerWallet: string;
  buyerWallet: string;
  solAmount: number;
}): Promise<boolean> {
  try {
    const connection = getEscrowConnection();
    const tx = await connection.getParsedTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return false;
    }

    const accountKeys = tx.transaction.message.accountKeys.map((key) =>
      key.pubkey.toBase58()
    );
    const senderIndex = accountKeys.indexOf(sellerWallet);
    const receiverIndex = accountKeys.indexOf(buyerWallet);

    if (senderIndex === -1 || receiverIndex === -1) {
      return false;
    }

    const preBalances = tx.meta?.preBalances ?? [];
    const postBalances = tx.meta?.postBalances ?? [];

    const senderDelta =
      (preBalances[senderIndex] ?? 0) - (postBalances[senderIndex] ?? 0);
    const receiverDelta =
      (postBalances[receiverIndex] ?? 0) - (preBalances[receiverIndex] ?? 0);

    const claimedLamports = Math.round(solAmount * 1_000_000_000);
    const toleranceLamports = 5_000_000; // ~0.005 SOL slack for fees/rounding

    const senderPaidRoughlyRight =
      Math.abs(senderDelta - claimedLamports) <= toleranceLamports;
    const receiverGotRoughlyRight =
      Math.abs(receiverDelta - claimedLamports) <= toleranceLamports;

    return senderPaidRoughlyRight && receiverGotRoughlyRight;
  } catch (error) {
    console.error("[verifyRefundTransaction] verification failed:", error);
    return false;
  }
}

export async function recordBundleRefundSent({
  groupId,
  sellerWallet,
  txSignature,
  solAmount,
  client = supabase,
}: {
  groupId: string;
  sellerWallet: string;
  txSignature: string;
  solAmount: number;
  client?: SupabaseClient;
}): Promise<ShipmentGroup> {
  const trimmedSignature = txSignature.trim();
  if (!trimmedSignature) {
    throw new Error("Transaction signature is required.");
  }
  if (!Number.isFinite(solAmount) || solAmount <= 0) {
    throw new Error("Refund amount is invalid.");
  }

  const nudges = await fetchBundleRefundNudges(sellerWallet, client);
  const nudge = nudges.find((entry) => entry.groupId === groupId);
  if (!nudge) {
    throw new Error("This bundle is not eligible for a refund right now.");
  }

  const verified = await verifyRefundTransaction({
    txSignature: trimmedSignature,
    sellerWallet,
    buyerWallet: nudge.buyerWallet,
    solAmount,
  });

  if (!verified) {
    throw new Error(
      "We couldn't verify that transaction on-chain. Please check the signature and try again."
    );
  }

  const now = new Date().toISOString();
  const { data: updatedGroup, error: updateError } = await client
    .from("shipment_groups")
    .update({
      refund_sent_at: now,
      refund_tx_signature: trimmedSignature,
    })
    .eq("id", groupId)
    .is("refund_sent_at", null)
    .select("*")
    .single();

  if (updateError) {
    logSupabaseError("recordBundleRefundSent", updateError);
    throw new Error("Unable to record refund. Please try again.");
  }

  const group = parseShipmentGroup(updatedGroup as Record<string, unknown>);

  if (nudge.threadId) {
    await notifyBundleRefundSent({
      buyerWallet: group.buyer_wallet,
      bundleReference: group.bundle_reference,
      solAmount,
      threadId: nudge.threadId,
      groupId: group.id,
      txSignature: trimmedSignature,
      client,
    });
  }

  return group;
}
