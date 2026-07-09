import type { Auction, ListingType, PurchaseType } from "@/lib/database.types";
import { getEffectiveBid } from "@/lib/parse-auction";

export const GTC_END_TIME = "9999-12-31T23:59:59.999Z";

export type ListingTypeOption = ListingType;

export function normalizeListingType(value: unknown): ListingType {
  if (
    value === "auction" ||
    value === "auction_buy_now" ||
    value === "fixed_price"
  ) {
    return value;
  }
  return "auction";
}

export function normalizePurchaseType(value: unknown): PurchaseType {
  if (value === "buy_now" || value === "auction") {
    return value;
  }
  return "auction";
}

export function isFixedPriceListing(auction: Pick<Auction, "listing_type">): boolean {
  return auction.listing_type === "fixed_price";
}

export function hasBuyNowOption(auction: Pick<Auction, "listing_type">): boolean {
  return (
    auction.listing_type === "auction_buy_now" ||
    auction.listing_type === "fixed_price"
  );
}

export function isGoodTillCancelled(
  auction: Pick<Auction, "good_till_cancelled">
): boolean {
  return Boolean(auction.good_till_cancelled);
}

export function getBuyNowPrice(
  auction: Pick<Auction, "buy_now_price" | "listing_type" | "start_price">
): number | null {
  if (auction.buy_now_price != null && auction.buy_now_price > 0) {
    return auction.buy_now_price;
  }
  if (isFixedPriceListing(auction) && auction.start_price > 0) {
    return auction.start_price;
  }
  return null;
}

export function isListingLive(
  auction: Pick<
    Auction,
    "status" | "end_time" | "good_till_cancelled" | "escrow_state"
  >
): boolean {
  if (auction.status !== "live") return false;
  if (auction.escrow_state === "funded" || auction.escrow_state === "complete") {
    return false;
  }
  if (isGoodTillCancelled(auction)) return true;
  if (!auction.end_time) return false;
  return new Date(auction.end_time).getTime() > Date.now();
}

export function canBuyNow(
  auction: Pick<
    Auction,
    | "status"
    | "end_time"
    | "good_till_cancelled"
    | "escrow_state"
    | "listing_type"
    | "buy_now_price"
    | "start_price"
    | "seller_wallet"
  >,
  buyerWallet: string | null | undefined
): boolean {
  if (!buyerWallet?.trim()) return false;
  if (buyerWallet.trim() === auction.seller_wallet.trim()) return false;
  if (!hasBuyNowOption(auction)) return false;
  if (!isListingLive(auction)) return false;
  const price = getBuyNowPrice(auction);
  return price != null && price > 0;
}

export function getCardDisplayPrice(auction: Auction): number {
  if (isFixedPriceListing(auction)) {
    return getBuyNowPrice(auction) ?? 0;
  }
  return getEffectiveBid(auction);
}

export function shouldShowCountdown(auction: Auction): boolean {
  if (!isListingLive(auction)) return false;
  if (isGoodTillCancelled(auction)) return false;
  return Boolean(auction.end_time);
}

export function getListingExpiryLabel(auction: Auction): string | null {
  if (isGoodTillCancelled(auction) && isListingLive(auction)) {
    return "Good Till Cancelled";
  }
  if (!auction.end_time || isGoodTillCancelled(auction)) return null;
  return new Date(auction.end_time).toLocaleString();
}
