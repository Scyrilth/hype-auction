"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardBidPrice,
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import FiatValue from "@/components/ui/FiatValue";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { AuctionSearchHit } from "@/lib/search";

export default function SearchAuctionCard({
  auction,
}: {
  auction: AuctionSearchHit;
}) {
  const displayBid =
    auction.currentBid > 0 ? auction.currentBid : auction.startPrice;
  const imageSrc = resolveAuctionImageUrl(auction.imageUrl, {
    title: auction.title,
    category: auction.category,
  });

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group flex h-full w-full min-w-[11.5rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative aspect-[4/3] h-auto w-full overflow-hidden bg-surface-elevated">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <WatchlistHeart auctionId={auction.id} />
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle className="group-hover:text-purple-100">
              {auction.title}
            </AuctionCardTitle>
            <AuctionCardCategorySlot category={auction.category} />
            <AuctionLabelBadges
              auction={{
                id: auction.id,
                current_bid: auction.currentBid,
                start_price: auction.startPrice,
                end_time: auction.endTime,
                created_at: auction.createdAt,
                category: auction.category,
                item_details: auction.itemDetails ?? {},
                status: auction.status === "live" ? "live" : "ended",
                is_featured: auction.isFeatured,
              }}
              bidCount={auction.bidCount}
              className="mt-2"
            />
          </>
        }
        footer={
          <>
            <p className="mb-2 text-xs text-muted">
              {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
            </p>
            <div className="flex items-end justify-between gap-2">
              <div className="shrink-0">
                <p className="whitespace-nowrap text-xs text-muted">Current bid</p>
                <AuctionCardBidPrice amount={displayBid} />
                <FiatValue solAmount={displayBid} />
              </div>

              {auction.status === "live" && (
                <div className="shrink-0 text-right">
                  <p className="whitespace-nowrap text-xs text-muted">Time left</p>
                  <CountdownTimer endTime={auction.endTime} compact />
                </div>
              )}
            </div>
          </>
        }
      />
    </Link>
  );
}
