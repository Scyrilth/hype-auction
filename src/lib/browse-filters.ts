import type { BrowseAuctionItem } from "@/lib/browse";
import type { Auction } from "@/lib/database.types";
import { isFixedPriceListing } from "@/lib/listing-types";

export type BrowseSectionSortOption =
  | "most-bids"
  | "highest-bid"
  | "lowest-bid"
  | "newest";

export type BrowseListingFilter = "all" | "fixed_price";

export const BROWSE_SECTION_SORT_OPTIONS: {
  id: BrowseSectionSortOption;
  label: string;
}[] = [
  { id: "most-bids", label: "Most Bids" },
  { id: "highest-bid", label: "Highest Bid" },
  { id: "lowest-bid", label: "Lowest Bid" },
  { id: "newest", label: "Newest" },
];

export const BROWSE_LISTING_FILTER_OPTIONS: {
  id: BrowseListingFilter;
  label: string;
}[] = [
  { id: "all", label: "All Listings" },
  { id: "fixed_price", label: "Fixed Price" },
];

function getDisplayBid(auction: Auction) {
  if (isFixedPriceListing(auction)) {
    return auction.buy_now_price ?? auction.start_price;
  }
  return auction.current_bid > 0 ? auction.current_bid : auction.start_price;
}

export function filterBrowseAuctions(
  items: BrowseAuctionItem[],
  categoryFilter: string,
  listingFilter: BrowseListingFilter = "all"
) {
  let filtered = items;

  if (categoryFilter !== "all") {
    filtered = filtered.filter((item) => item.auction.category === categoryFilter);
  }

  if (listingFilter === "fixed_price") {
    filtered = filtered.filter((item) =>
      isFixedPriceListing(item.auction)
    );
  }

  return filtered;
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

export function isBrowseFilterActive(
  globalCategory: string,
  listingFilter: BrowseListingFilter = "all"
) {
  return globalCategory !== "all" || listingFilter !== "all";
}

export function getSectionSortLabel(sortBy: BrowseSectionSortOption) {
  return (
    BROWSE_SECTION_SORT_OPTIONS.find((option) => option.id === sortBy)?.label ??
    "Most Bids"
  );
}
