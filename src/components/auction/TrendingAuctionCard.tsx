import Image from "next/image";
import Link from "next/link";

import CountdownTimer from "@/components/auction/CountdownTimer";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { formatSol } from "@/lib/format";

export default function TrendingAuctionCard({
  auction,
  bidCount24h,
}: {
  auction: Auction;
  bidCount24h: number;
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
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </span>
        {bidCount24h > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            🔥 {bidCount24h} {bidCount24h === 1 ? "bid" : "bids"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-purple-100">
          {auction.title}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted">Current bid</p>
            <p className="text-lg font-bold text-accent">{formatSol(displayBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Time left</p>
            <CountdownTimer endTime={auction.end_time} compact />
          </div>
        </div>
      </div>
    </Link>
  );
}
