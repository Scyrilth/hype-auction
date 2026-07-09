import type { ListingType, PurchaseType } from "@/lib/database.types";

export type PurchaseTypeBadgeId =
  | "auction_win"
  | "buy_now_auction"
  | "buy_now_fixed";

export function resolvePurchaseTypeBadge(
  purchaseType: PurchaseType,
  listingType: ListingType,
  role: "buying" | "selling"
): { id: PurchaseTypeBadgeId; label: string; className: string } | null {
  if (purchaseType !== "buy_now") {
    return null;
  }

  if (listingType === "fixed_price") {
    return {
      id: "buy_now_fixed",
      label: role === "buying" ? "Fixed Price Purchase" : "Fixed Price Sale",
      className: "bg-teal-500/20 text-teal-300",
    };
  }

  return {
    id: "buy_now_auction",
    label: role === "buying" ? "Bought Now" : "Instant Sale",
    className: "bg-amber-500/20 text-amber-300",
  };
}
