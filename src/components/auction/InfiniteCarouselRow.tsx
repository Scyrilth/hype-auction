"use client";

import { useEffect, useState } from "react";

import LiveAuctionCard from "@/components/auction/LiveAuctionCard";
import TrendingAuctionCard from "@/components/auction/TrendingAuctionCard";
import BrowseAuctionCard from "@/components/browse/BrowseAuctionCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { AuctionWithBidCount24h } from "@/lib/auctions";
import {
  getAuctionCardLabelProps,
  type AuctionLabelMaps,
} from "@/lib/auction-labels";
import type { Auction } from "@/lib/database.types";

type InfiniteCarouselRowProps = {
  labelMaps?: AuctionLabelMaps;
  visibleCount?: number;
} & (
  | {
      variant: "trending";
      items: AuctionWithBidCount24h[];
    }
  | {
      variant: "browse";
      items: Auction[];
    }
  | {
      variant: "live";
      items: Auction[];
    }
);

function getItemKey(
  variant: InfiniteCarouselRowProps["variant"],
  item: Auction | AuctionWithBidCount24h
): string {
  if (variant === "trending") {
    return (item as AuctionWithBidCount24h).auction.id;
  }
  return (item as Auction).id;
}

function renderCarouselItem(
  props: InfiniteCarouselRowProps,
  item: Auction | AuctionWithBidCount24h
) {
  const { variant, labelMaps } = props;

  if (variant === "trending") {
    const trendingItem = item as AuctionWithBidCount24h;
    const labelProps = getAuctionCardLabelProps(
      trendingItem.auction.id,
      labelMaps,
      trendingItem.bidCount24h
    );

    return (
      <TrendingAuctionCard
        auction={trendingItem.auction}
        bidCount24h={trendingItem.bidCount24h}
        bidCount={labelProps.bidCount}
        isTopFeaturedByBids={labelProps.isTopFeaturedByBids}
      />
    );
  }

  if (variant === "browse") {
    const auction = item as Auction;
    return (
      <BrowseAuctionCard
        auction={auction}
        {...getAuctionCardLabelProps(auction.id, labelMaps)}
      />
    );
  }

  const auction = item as Auction;
  return (
    <LiveAuctionCard
      auction={auction}
      {...getAuctionCardLabelProps(auction.id, labelMaps)}
    />
  );
}

export default function InfiniteCarouselRow(props: InfiniteCarouselRowProps) {
  const { variant, items, visibleCount = 5 } = props;
  const [startIndex, setStartIndex] = useState(0);
  const itemCount = items.length;
  const slots = Math.min(visibleCount, itemCount);

  useEffect(() => {
    setStartIndex(0);
  }, [itemCount]);

  if (itemCount === 0) return null;

  const visibleItems = Array.from(
    { length: slots },
    (_, slotIndex) => items[(startIndex + slotIndex) % itemCount]
  );

  const showArrows = itemCount > 1;

  return (
    <div className="flex items-center gap-2">
      {showArrows ? (
        <button
          type="button"
          onClick={() =>
            setStartIndex((index) => (index - 1 + itemCount) % itemCount)
          }
          className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 shrink-0" aria-hidden />
      )}

      <div
        className="grid min-w-0 flex-1 justify-items-start gap-3 overflow-x-auto sm:gap-4"
        style={{
          gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
        }}
      >
        {visibleItems.map((item, slotIndex) => (
          <div
            key={`${getItemKey(variant, item)}-${slotIndex}-${startIndex}`}
            className="w-full min-w-0 overflow-hidden transition-opacity duration-300"
          >
            {renderCarouselItem(props, item)}
          </div>
        ))}
      </div>

      {showArrows ? (
        <button
          type="button"
          onClick={() => setStartIndex((index) => (index + 1) % itemCount)}
          className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 shrink-0" aria-hidden />
      )}
    </div>
  );
}
