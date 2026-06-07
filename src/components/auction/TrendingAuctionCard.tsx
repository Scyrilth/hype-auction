import Image from "next/image";
import Link from "next/link";

import {
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import FiatValue from "@/components/ui/FiatValue";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { formatSol } from "@/lib/format";

export default function TrendingAuctionCard({
  auction,
  bidCount24h,
  bidCount,
  isTopFeaturedByBids,
}: {
  auction: Auction;
  bidCount24h: number;
  bidCount?: number;
  isTopFeaturedByBids?: boolean;
}) {
  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          sizes="20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <WatchlistHeart auctionId={auction.id} />
        {bidCount24h > 0 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            🔥 {bidCount24h} {bidCount24h === 1 ? "bid" : "bids"}
          </span>
        )}
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle className="group-hover:text-purple-100">
              {auction.title}
            </AuctionCardTitle>
            <AuctionLabelBadges
              auction={auction}
              bidCount={bidCount}
              bidCount24h={bidCount24h}
              isTopFeaturedByBids={isTopFeaturedByBids}
              className="mt-2"
            />
          </>
        }
        footer={
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-muted">Current bid</p>
              <p className="text-lg font-bold text-accent">
                {formatSol(displayBid)}
              </p>
              <FiatValue solAmount={displayBid} showTooltip={false} />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Time left</p>
              <CountdownTimer endTime={auction.end_time} compact />
            </div>
          </div>
        }
      />
    </Link>
  );
}
