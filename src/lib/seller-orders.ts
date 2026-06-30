import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { parseAuctionRow } from "@/lib/parse-auction";
import {
  insertThreadSystemMessage,
  type MessageThread,
} from "@/lib/messages";
import { notifyItemShipped } from "@/lib/notifications";
import { logEscrowShipped } from "@/lib/escrow-ledger";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export const THREAD_SHIPPING_CARRIERS = [
  "DHL",
  "FedEx",
  "UPS",
  "USPS",
  "Royal Mail",
  "Other",
] as const;

export type ThreadShippingCourier = (typeof THREAD_SHIPPING_CARRIERS)[number];

export type SellerOrderActionType = "ship" | "dispute";

export interface SellerOrderNeedingAction {
  threadId: string;
  auctionId: string;
  title: string;
  imageUrl: string | null;
  referenceNumber: string | null;
  actionType: SellerOrderActionType;
  actionLabel: string;
  buttonLabel: string;
  buttonHref: string;
}

function parseThreadRow(row: Record<string, unknown>): MessageThread {
  return {
    id: row.id as string,
    auction_id: (row.auction_id as string | null) ?? null,
    buyer_wallet: row.buyer_wallet as string,
    seller_wallet: row.seller_wallet as string,
    status: row.status as MessageThread["status"],
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    archive_at: (row.archive_at as string | null) ?? null,
    created_at: row.created_at as string,
    escrow_status: (row.escrow_status as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    carrier: (row.carrier as string | null) ?? null,
    shipped_at: (row.shipped_at as string | null) ?? null,
  };
}

function resolveEscrowStatus(
  thread: Pick<MessageThread, "escrow_status">,
  auction: Pick<Auction, "escrow_state"> | null
): string | null {
  return thread.escrow_status ?? auction?.escrow_state ?? null;
}

function hasTracking(
  thread: Pick<MessageThread, "tracking_number">,
  auction: Pick<Auction, "tracking_number"> | null
): boolean {
  return Boolean(
    thread.tracking_number?.trim() || auction?.tracking_number?.trim()
  );
}

export async function fetchSellerOrdersNeedingAction(
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<SellerOrderNeedingAction[]> {
  const { data: threadRows, error } = await client
    .from("message_threads")
    .select(
      "id, auction_id, buyer_wallet, seller_wallet, status, escrow_status, tracking_number, carrier, shipped_at, confirmed_at, archive_at, created_at"
    )
    .eq("seller_wallet", sellerWallet)
    .eq("status", "active")
    .not("auction_id", "is", null);

  if (error) throw error;
  if (!threadRows?.length) return [];

  const auctionIds = [
    ...new Set(
      threadRows
        .map((row) => row.auction_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: auctionRows, error: auctionError } = await client
    .from("auctions")
    .select(
      "id, title, image_url, category, reference_number, escrow_state, tracking_number"
    )
    .in("id", auctionIds);

  if (auctionError) throw auctionError;

  const auctionMap = new Map(
    (auctionRows ?? []).map((row) => [
      row.id as string,
      parseAuctionRow(row as Record<string, unknown>),
    ])
  );

  const orders: SellerOrderNeedingAction[] = [];

  for (const row of threadRows) {
    const thread = parseThreadRow(row as Record<string, unknown>);
    if (!thread.auction_id) continue;

    const auction = auctionMap.get(thread.auction_id) ?? null;
    if (!auction) continue;

    const escrowStatus = resolveEscrowStatus(thread, auction);
    const trackingUploaded = hasTracking(thread, auction);

    if (escrowStatus === "funded" && !trackingUploaded) {
      orders.push({
        threadId: thread.id,
        auctionId: thread.auction_id,
        title: auction.title,
        imageUrl: auction.image_url,
        referenceNumber: auction.reference_number,
        actionType: "ship",
        actionLabel: "Ship item — payment secured in escrow",
        buttonLabel: "Upload Tracking",
        buttonHref: `/messages/${thread.id}`,
      });
      continue;
    }

    if (escrowStatus === "disputed") {
      orders.push({
        threadId: thread.id,
        auctionId: thread.auction_id,
        title: auction.title,
        imageUrl: auction.image_url,
        referenceNumber: auction.reference_number,
        actionType: "dispute",
        actionLabel: "Dispute opened — review and respond",
        buttonLabel: "View Thread",
        buttonHref: `/messages/${thread.id}`,
      });
    }
  }

  return orders.sort((a, b) => a.title.localeCompare(b.title));
}

export async function submitThreadShippingTracking({
  threadId,
  sellerWallet,
  carrier,
  trackingNumber,
  onChainSignature,
  client = supabase,
}: {
  threadId: string;
  sellerWallet: string;
  carrier: string;
  trackingNumber: string;
  onChainSignature?: string | null;
  client?: SupabaseClient;
}): Promise<MessageThread> {
  const trimmedCarrier = carrier.trim();
  const trimmedTracking = trackingNumber.trim();

  if (!trimmedCarrier) throw new Error("Select a carrier.");
  if (!trimmedTracking) throw new Error("Enter a tracking number.");

  const { data: threadRow, error: threadError } = await client
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) throw threadError;
  if (!threadRow) throw new Error("Thread not found.");
  if (threadRow.seller_wallet !== sellerWallet) {
    throw new Error("Only the seller can upload tracking for this order.");
  }
  if (!threadRow.auction_id) {
    throw new Error("Tracking can only be uploaded for auction orders.");
  }

  const thread = parseThreadRow(threadRow as Record<string, unknown>);
  const auctionId = thread.auction_id as string;

  const { data: auctionRow, error: auctionError } = await client
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .maybeSingle();

  if (auctionError) throw auctionError;
  if (!auctionRow) throw new Error("Auction not found.");
  if (auctionRow.seller_wallet !== sellerWallet) {
    throw new Error("Only the seller can upload tracking for this order.");
  }

  const auction = parseAuctionRow(auctionRow as Record<string, unknown>);
  const escrowStatus = resolveEscrowStatus(thread, auction);

  if (escrowStatus !== "funded") {
    throw new Error("Payment must be secured in escrow before shipping.");
  }

  if (hasTracking(thread, auction)) {
    throw new Error("Tracking has already been uploaded for this order.");
  }

  const now = new Date().toISOString();
  const systemMessage = `📦 Seller has shipped the item. Tracking: ${trimmedTracking} via ${trimmedCarrier}`;

  const { data: updatedThread, error: updateThreadError } = await client
    .from("message_threads")
    .update({
      tracking_number: trimmedTracking,
      carrier: trimmedCarrier,
      escrow_status: "shipped",
      shipped_at: now,
    })
    .eq("id", threadId)
    .select("*")
    .single();

  if (updateThreadError) throw updateThreadError;

  const { error: auctionUpdateError } = await client
    .from("auctions")
    .update({
      tracking_courier: trimmedCarrier,
      tracking_number: trimmedTracking,
      tracking_uploaded_at: now,
      shipping_status: "shipped",
      escrow_state: "shipped",
    })
    .eq("id", auctionId);

  if (auctionUpdateError) throw auctionUpdateError;

  await insertThreadSystemMessage(
    threadId,
    systemMessage,
    sellerWallet,
    client
  );

  await notifyItemShipped({
    buyerWallet: thread.buyer_wallet,
    auctionTitle: auction.title,
    courier: trimmedCarrier,
    trackingNumber: trimmedTracking,
    threadId,
  });

  const escrowPda = auction.escrow_pda;
  const totalLamports = auction.escrow_amount_lamports ?? 0;
  if (escrowPda && totalLamports > 0) {
    await logEscrowShipped({
      auctionId,
      threadId,
      sellerWallet,
      escrowPda,
      amountLamports: totalLamports,
      onChainSignature: onChainSignature ?? null,
      client,
    });
  }

  return parseThreadRow(updatedThread as Record<string, unknown>);
}

export function getOrderThumbnail(
  title: string,
  imageUrl: string | null,
  category: string | null
): string {
  return resolveAuctionImageUrl(imageUrl, { title, category });
}
