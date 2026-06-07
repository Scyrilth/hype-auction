import type { BrowseAuctionItem } from "@/lib/browse";
import type { Auction } from "@/lib/database.types";

export type BrowseSortOption =
  | "most-bids"
  | "highest-bid"
  | "lowest-bid"
  | "newest"
  | "ending-soon";

export const BROWSE_SORT_OPTIONS: { id: BrowseSortOption; label: string }[] = [
  { id: "most-bids", label: "Most Bids" },
  { id: "highest-bid", label: "Highest Bid" },
  { id: "lowest-bid", label: "Lowest Bid" },
  { id: "newest", label: "Newest" },
  { id: "ending-soon", label: "Ending Soon" },
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

export function resolveBrowseCategory(
  globalCategory: string,
  sectionCategory: string
) {
  if (sectionCategory !== "all") return sectionCategory;
  return globalCategory;
}

export function sortBrowseAuctions(
  items: BrowseAuctionItem[],
  sortBy: BrowseSortOption
) {
  const sorted = [...items];

  switch (sortBy) {
    case "ending-soon":
      return sorted.sort(
        (a, b) =>
          new Date(a.auction.end_time).getTime() -
          new Date(b.auction.end_time).getTime()
      );
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

export function isBrowseFilterActive(
  globalCategory: string,
  sortBy: BrowseSortOption,
  sectionCategories: Record<string, string>
) {
  if (globalCategory !== "all" || sortBy !== "most-bids") return true;
  return Object.values(sectionCategories).some((category) => category !== "all");
}
