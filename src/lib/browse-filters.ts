import type { AuctionWithBidCount24h } from "@/lib/auctions";
import type { Auction } from "@/lib/database.types";

export type BrowseSortOption =
  | "trending"
  | "ending-soon"
  | "recently-listed"
  | "highest-bid"
  | "lowest-bid";

export const BROWSE_SORT_OPTIONS: { id: BrowseSortOption; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "ending-soon", label: "Ending Soon" },
  { id: "recently-listed", label: "Recently Listed" },
  { id: "highest-bid", label: "Highest Bid" },
  { id: "lowest-bid", label: "Lowest Bid" },
];

function getDisplayBid(auction: Auction) {
  return auction.current_bid > 0 ? auction.current_bid : auction.start_price;
}

export function filterBrowseAuctions(
  items: AuctionWithBidCount24h[],
  categoryFilter: string
) {
  if (categoryFilter === "all") return items;
  return items.filter((item) => item.auction.category === categoryFilter);
}

export function sortBrowseAuctions(
  items: AuctionWithBidCount24h[],
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
    case "recently-listed":
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
    case "trending":
    default:
      return sorted.sort(
        (a, b) =>
          b.bidCount24h - a.bidCount24h ||
          getDisplayBid(b.auction) - getDisplayBid(a.auction)
      );
  }
}

export function isBrowseFilterActive(
  categoryFilter: string,
  sortBy: BrowseSortOption
) {
  return categoryFilter !== "all" || sortBy !== "trending";
}
