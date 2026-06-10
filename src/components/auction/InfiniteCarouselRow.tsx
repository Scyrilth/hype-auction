"use client";

import { useCallback, useEffect, useRef } from "react";

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

function getScrollStep(container: HTMLElement): number {
  const item = container.querySelector<HTMLElement>(":scope > .horizontal-scroll-item");
  if (!item) return container.clientWidth;

  const styles = getComputedStyle(container);
  const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
  return item.offsetWidth + gap;
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
  const { variant, items } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemCount = items.length;

  const scrollByOneCard = useCallback((direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const amount = getScrollStep(container);
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollLeft = 0;
  }, [itemCount]);

  if (itemCount === 0) return null;

  const showArrows = itemCount > 1;

  return (
    <div className="flex items-center gap-2">
      {showArrows ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("left")}
          className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 shrink-0" aria-hidden />
      )}

      <div
        ref={scrollRef}
        className="horizontal-scroll-row flex min-w-0 flex-1 gap-3 overflow-x-auto sm:gap-4"
      >
        {items.map((item) => (
          <div
            key={getItemKey(variant, item)}
            className="horizontal-scroll-item w-[11.5rem] sm:w-[14rem]"
          >
            {renderCarouselItem(props, item)}
          </div>
        ))}
      </div>

      {showArrows ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("right")}
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
