"use client";

import Link from "next/link";

import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardBidPrice,
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardImage,
  AuctionCardShippingLine,
  AuctionCardTitle,
  ViewAuctionButton,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import FiatValue from "@/components/ui/FiatValue";
import type { Auction } from "@/lib/database.types";
import { getEffectiveBid } from "@/lib/parse-auction";

export default function LiveAuctionCard({
  auction,
  bidCount,
  bidCount24h,
  isTopFeaturedByBids,
}: {
  auction: Auction;
  bidCount?: number;
  bidCount24h?: number;
  isTopFeaturedByBids?: boolean;
}) {
  const displayBid = getEffectiveBid(auction);

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative w-full h-48 overflow-hidden bg-surface-elevated">
        <AuctionCardImage
          imageUrl={auction.image_url}
          title={auction.title}
          category={auction.category}
          auction={auction}
          imageClassName="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        <WatchlistHeart auctionId={auction.id} />
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle>{auction.title}</AuctionCardTitle>
            <AuctionCardCategorySlot category={auction.category} />
            <AuctionLabelBadges
              auction={{
                id: auction.id,
                current_bid: auction.current_bid,
                start_price: auction.start_price,
                end_time: auction.end_time,
                created_at: auction.created_at,
                category: auction.category,
                item_details: auction.item_details ?? {},
                status: auction.status,
                is_featured: auction.is_featured,
              }}
              bidCount={bidCount}
              bidCount24h={bidCount24h}
              isTopFeaturedByBids={isTopFeaturedByBids}
              className="mt-2"
            />
          </>
        }
        footer={
          <div className="flex items-end justify-between gap-2">
            <div className="shrink-0">
              <p className="whitespace-nowrap text-xs text-muted">Current bid</p>
              <AuctionCardBidPrice amount={displayBid} />
              <AuctionCardShippingLine
                domesticShippingUsd={auction.domestic_shipping_usd}
              />
              <FiatValue solAmount={displayBid} />
            </div>
            <div className="shrink-0 text-right">
              <p className="whitespace-nowrap text-xs text-muted">Time left</p>
              <CountdownTimer endTime={auction.end_time} compact />
            </div>
          </div>
        }
      />

      <div className="px-4 pb-4">
        <ViewAuctionButton
          auctionId={auction.id}
          asSpan
          className="group-hover:bg-accent-hover"
        />
      </div>
    </Link>
  );
}
