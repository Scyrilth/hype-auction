import type {
  Auction,
  AuctionStatus,
  EscrowState,
  ShippingStatus,
} from "@/lib/database.types";

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeItemDetails(
  raw: unknown
): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.trim() || value == null) continue;

    if (typeof value === "boolean") {
      out[key] = value ? "Yes" : "No";
      continue;
    }

    if (typeof value === "number") {
      out[key] = String(value);
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) out[key] = trimmed;
      continue;
    }

    out[key] = String(value);
  }

  return out;
}

export function getEffectiveBid(auction: {
  current_bid?: number | null;
  start_price?: number | null;
}): number {
  const startPrice = safeNumber(auction.start_price);
  const currentBid = safeNumber(auction.current_bid);
  return currentBid > 0 ? currentBid : startPrice;
}

export function parseAuctionRow(row: Record<string, unknown>): Auction {
  const shippingStatus = row.shipping_status as string | null | undefined;
  const startPrice = safeNumber(row.start_price);
  const currentBid = safeNumber(row.current_bid);

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "").trim() || "Untitled Auction",
    description: (row.description as string | null) ?? "",
    image_url: (row.image_url as string | null) ?? null,
    seller_wallet: String(row.seller_wallet ?? "unknown"),
    current_bid: currentBid,
    start_price: startPrice,
    end_time: row.end_time as string,
    status: row.status as AuctionStatus,
    category: (row.category as string | null) ?? null,
    condition: (row.condition as string | null) ?? null,
    additional_images: Array.isArray(row.additional_images)
      ? (row.additional_images as string[])
      : [],
    item_details: normalizeItemDetails(row.item_details),
    created_at: row.created_at as string,
    is_featured: Boolean(row.is_featured),
    reference_number: (row.reference_number as string | null) ?? null,
    tracking_courier: (row.tracking_courier as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    tracking_uploaded_at: (row.tracking_uploaded_at as string | null) ?? null,
    shipping_status: (shippingStatus === "shipped" ||
    shippingStatus === "delivered"
      ? shippingStatus
      : "pending") as ShippingStatus,
    escrow_pda: (row.escrow_pda as string | null) ?? null,
    escrow_tx_signature: (row.escrow_tx_signature as string | null) ?? null,
    escrow_funded: Boolean(row.escrow_funded),
    escrow_funded_at: (row.escrow_funded_at as string | null) ?? null,
    escrow_amount_lamports:
      row.escrow_amount_lamports != null
        ? Number(row.escrow_amount_lamports)
        : null,
    escrow_attempt_number: Number(row.escrow_attempt_number ?? 1),
    escrow_state: ((row.escrow_state as string | null | undefined) ??
      "none") as EscrowState,
    escrow_expired_at: (row.escrow_expired_at as string | null) ?? null,
    sol_usd_rate_at_payment:
      row.sol_usd_rate_at_payment != null
        ? safeNumber(row.sol_usd_rate_at_payment)
        : null,
    payment_completed_at:
      (row.payment_completed_at as string | null) ?? null,
    domestic_shipping_usd: safeNumber(row.domestic_shipping_usd),
    international_shipping_usd: safeNumber(row.international_shipping_usd),
    is_dummy: Boolean(row.is_dummy),
    next_bidder_offered_at:
      (row.next_bidder_offered_at as string | null) ?? null,
    next_bidder_response_deadline:
      (row.next_bidder_response_deadline as string | null) ?? null,
    next_bidder_wallet: (row.next_bidder_wallet as string | null) ?? null,
    relisted_auction_id: (row.relisted_auction_id as string | null) ?? null,
    payment_excluded_wallets: Array.isArray(row.payment_excluded_wallets)
      ? (row.payment_excluded_wallets as string[])
      : [],
  };
}
