"use client";

import { useEffect, useState } from "react";

import LiveAuctionCard from "@/components/auction/LiveAuctionCard";
import TrendingAuctionCard from "@/components/auction/TrendingAuctionCard";
import BrowseAuctionCard from "@/components/browse/BrowseAuctionCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { AuctionWithBidCount24h } from "@/lib/auctions";
import type { Auction } from "@/lib/database.types";

type InfiniteCarouselRowProps =
  | {
      variant: "trending";
      items: AuctionWithBidCount24h[];
      visibleCount?: number;
    }
  | {
      variant: "browse";
      items: Auction[];
      visibleCount?: number;
    }
  | {
      variant: "live";
      items: Auction[];
      visibleCount?: number;
    };

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
  variant: InfiniteCarouselRowProps["variant"],
  item: Auction | AuctionWithBidCount24h
) {
  if (variant === "trending") {
    const trendingItem = item as AuctionWithBidCount24h;
    return (
      <TrendingAuctionCard
        auction={trendingItem.auction}
        bidCount24h={trendingItem.bidCount24h}
      />
    );
  }

  if (variant === "browse") {
    return <BrowseAuctionCard auction={item as Auction} />;
  }

  return <LiveAuctionCard auction={item as Auction} />;
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
        className="grid min-w-0 flex-1 gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((item, slotIndex) => (
          <div
            key={`${getItemKey(variant, item)}-${slotIndex}-${startIndex}`}
            className="min-w-0 transition-opacity duration-300"
          >
            {renderCarouselItem(variant, item)}
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
