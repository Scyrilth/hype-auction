import type { BrowseAuctionItem } from "@/lib/browse";
import type { Auction } from "@/lib/database.types";

export type BrowseSectionSortOption =
  | "most-bids"
  | "highest-bid"
  | "lowest-bid"
  | "newest";

export const BROWSE_SECTION_SORT_OPTIONS: {
  id: BrowseSectionSortOption;
  label: string;
}[] = [
  { id: "most-bids", label: "Most Bids" },
  { id: "highest-bid", label: "Highest Bid" },
  { id: "lowest-bid", label: "Lowest Bid" },
  { id: "newest", label: "Newest" },
];

function getDisplayBid(auction: Auction) {
  return auction.current_bid > 0 ? auction.current_bid : auction.start_price;
}

export function filterBrowseAuctions(
  items: BrowseAuctionItem[],
  categoryFilter: string
) {
  if (categoryFilter === "all") return items;
  return items.filter((item) => item.auction.category === categoryFilter);
}

export function sortBrowseAuctions(
  items: BrowseAuctionItem[],
  sortBy: BrowseSectionSortOption
) {
  const sorted = [...items];

  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.auction.created_at).getTime() -
          new Date(a.auction.created_at).getTime()
      );
    case "highest-bid":
      return sorted.sort(
        (a, b) => getDisplayBid(b.auction) - getDisplayBid(a.auction)
      );
    case "lowest-bid":
      return sorted.sort(
        (a, b) => getDisplayBid(a.auction) - getDisplayBid(b.auction)
      );
    case "most-bids":
    default:
      return sorted.sort(
        (a, b) =>
          b.bidCount - a.bidCount ||
          b.bidCount24h - a.bidCount24h ||
          getDisplayBid(b.auction) - getDisplayBid(a.auction)
      );
  }
}

export function isBrowseFilterActive(globalCategory: string) {
  return globalCategory !== "all";
}

export function getSectionSortLabel(sortBy: BrowseSectionSortOption) {
  return (
    BROWSE_SECTION_SORT_OPTIONS.find((option) => option.id === sortBy)?.label ??
    "Most Bids"
  );
}
