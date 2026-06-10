"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const SCROLL_EDGE_THRESHOLD = 4;

const carouselArrowClass =
  "z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm transition-all duration-150 ease-in-out hover:scale-110 hover:border-white/35 hover:bg-white/25";

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(container.scrollLeft > SCROLL_EDGE_THRESHOLD);
    setCanScrollRight(
      maxScrollLeft > SCROLL_EDGE_THRESHOLD &&
        container.scrollLeft < maxScrollLeft - SCROLL_EDGE_THRESHOLD
    );
  }, []);

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
    if (!container) return;

    container.scrollLeft = 0;
    updateScrollState();

    container.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [itemCount, updateScrollState]);

  if (itemCount === 0) return null;

  const showArrowControls = itemCount > 1;

  return (
    <div className="flex items-center gap-2">
      {showArrowControls && canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("left")}
          className={carouselArrowClass}
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

      {showArrowControls && canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("right")}
          className={carouselArrowClass}
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
