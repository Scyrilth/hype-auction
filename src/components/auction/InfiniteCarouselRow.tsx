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
const CAROUSEL_CARD_WIDTH_CLASS = "w-[220px]";

const carouselArrowClass =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-sm backdrop-blur-sm transition-all duration-150 ease-in-out hover:scale-110 hover:border-white/35 hover:bg-white/25";

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
  item: Auction | AuctionWithBidCount24h,
  reserveLabelSpace: boolean
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
        reserveLabelSpace={reserveLabelSpace}
      />
    );
  }

  if (variant === "browse") {
    const auction = item as Auction;
    return (
      <BrowseAuctionCard
        auction={auction}
        {...getAuctionCardLabelProps(auction.id, labelMaps)}
        reserveLabelSpace={reserveLabelSpace}
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
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const reserveLabelSpace = variant !== "live";

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const overflow = maxScrollLeft > SCROLL_EDGE_THRESHOLD;

    setHasOverflow(overflow);
    setCanScrollLeft(overflow && container.scrollLeft > SCROLL_EDGE_THRESHOLD);
    setCanScrollRight(
      overflow && container.scrollLeft < maxScrollLeft - SCROLL_EDGE_THRESHOLD
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

  const showLeftArrow = hasOverflow && canScrollLeft;
  const showRightArrow = hasOverflow && canScrollRight;

  return (
    <div className="homepage-carousel-track relative w-full min-w-0 max-w-full">
      <div
        ref={scrollRef}
        className="carousel-row-scroll flex w-full min-w-0 items-stretch gap-3 overflow-x-auto sm:gap-4"
      >
        {items.map((item) => (
          <div
            key={getItemKey(variant, item)}
            className={`horizontal-scroll-item ${CAROUSEL_CARD_WIDTH_CLASS} min-w-0 shrink-0`}
          >
            <div className="flex h-full w-full">
              {renderCarouselItem(props, item, reserveLabelSpace)}
            </div>
          </div>
        ))}
      </div>

      {showLeftArrow ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("left")}
          className={`${carouselArrowClass} left-1`}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      ) : null}

      {showRightArrow ? (
        <button
          type="button"
          onClick={() => scrollByOneCard("right")}
          className={`${carouselArrowClass} right-1`}
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
