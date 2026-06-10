"use client";

import InfiniteCarouselRow, {
  CAROUSEL_VISIBLE_COLUMNS,
} from "@/components/auction/InfiniteCarouselRow";
import BrowseSortPill from "@/components/browse/BrowseSortPill";
import type { BrowseAuctionItem } from "@/lib/browse";
import type { AuctionLabelMaps } from "@/lib/auction-labels";
import type { BrowseSectionSortOption } from "@/lib/browse-filters";
import type { Auction } from "@/lib/database.types";

export default function BrowseSection({
  title,
  count,
  auctions,
  trendingItems,
  variant = "browse",
  labelMaps,
  sortBy,
  onSortChange,
}: {
  title: string;
  count: number;
  auctions?: Auction[];
  trendingItems?: BrowseAuctionItem[];
  variant?: "browse" | "trending";
  labelMaps?: AuctionLabelMaps;
  sortBy: BrowseSectionSortOption;
  onSortChange: (sort: BrowseSectionSortOption) => void;
}) {
  const hasItems =
    variant === "trending"
      ? (trendingItems?.length ?? 0) > 0
      : (auctions?.length ?? 0) > 0;

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">
          {title}{" "}
          <span className="text-base font-normal text-muted">({count})</span>
        </h2>
        <BrowseSortPill value={sortBy} onChange={onSortChange} />
      </div>

      {hasItems ? (
        variant === "trending" && trendingItems ? (
          <InfiniteCarouselRow
            variant="trending"
            items={trendingItems}
            labelMaps={labelMaps}
            visibleCount={CAROUSEL_VISIBLE_COLUMNS}
          />
        ) : (
          auctions && (
            <InfiniteCarouselRow
              variant="browse"
              items={auctions}
              labelMaps={labelMaps}
              visibleCount={CAROUSEL_VISIBLE_COLUMNS}
            />
          )
        )
      ) : (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No auctions match your filters.
        </p>
      )}
    </section>
  );
}
