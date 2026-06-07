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
import type { Auction } from "@/lib/database.types";

export default function AuctionCard({
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
  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);
  const isLive =
    auction.status === "live" &&
    new Date(auction.end_time).getTime() > Date.now();

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group flex h-full w-full min-w-[11.5rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />

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
                current_bid: auction.current_bid,
                start_price: auction.start_price,
                end_time: auction.end_time,
                created_at: auction.created_at,
                category: auction.category,
                item_details: auction.item_details,
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
              <FiatValue solAmount={displayBid} />
            </div>

            {isLive && (
              <div className="shrink-0 text-right">
                <p className="whitespace-nowrap text-xs text-muted">Time left</p>
                <CountdownTimer endTime={auction.end_time} compact />
              </div>
            )}
          </div>
        }
      />
    </Link>
  );
}
