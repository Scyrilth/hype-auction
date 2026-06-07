"use client";

import InfiniteCarouselRow from "@/components/auction/InfiniteCarouselRow";
import type { AuctionWithBidCount24h } from "@/lib/auctions";
import type { AuctionLabelMaps } from "@/lib/auction-labels";
import type { Auction } from "@/lib/database.types";

export default function BrowseSection({
  title,
  count,
  auctions,
  trendingItems,
  variant = "browse",
  labelMaps,
}: {
  title: string;
  count: number;
  auctions?: Auction[];
  trendingItems?: AuctionWithBidCount24h[];
  variant?: "browse" | "trending";
  labelMaps?: AuctionLabelMaps;
}) {
  const hasItems =
    variant === "trending"
      ? (trendingItems?.length ?? 0) > 0
      : (auctions?.length ?? 0) > 0;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">
        {title}{" "}
        <span className="text-base font-normal text-muted">({count})</span>
      </h2>

      {hasItems ? (
        variant === "trending" && trendingItems ? (
          <InfiniteCarouselRow
            variant="trending"
            items={trendingItems}
            labelMaps={labelMaps}
          />
        ) : (
          auctions && (
            <InfiniteCarouselRow
              variant="browse"
              items={auctions}
              labelMaps={labelMaps}
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
