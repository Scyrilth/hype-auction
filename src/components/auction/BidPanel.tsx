"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CountdownTimer from "@/components/auction/CountdownTimer";
import { VIEW_AUCTION_BUTTON_CLASS } from "@/components/auction/AuctionCardLayout";
import type { Auction } from "@/lib/database.types";
import { formatSol, formatUsdSol, shortenAddress } from "@/lib/format";
import { getEffectiveBid } from "@/lib/parse-auction";

interface BidPanelProps {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

export default function BidPanel({
  auction,
  bidCount: initialBidCount,
  topBidder: initialTopBidder,
}: BidPanelProps) {
  const [bidCount, setBidCount] = useState(initialBidCount);
  const [topBidder, setTopBidder] = useState(initialTopBidder);
  const [currentBid, setCurrentBid] = useState(getEffectiveBid(auction));

  useEffect(() => {
    setBidCount(initialBidCount);
    setTopBidder(initialTopBidder);
    setCurrentBid(getEffectiveBid(auction));
  }, [initialBidCount, initialTopBidder, auction]);

  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:gap-5 sm:p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Current Bid
        </p>
        <p className="mt-1 text-[clamp(1.25rem,2.5vw,1.875rem)] font-bold leading-tight text-white">
          {formatSol(currentBid)}
        </p>
        <p className="text-xs text-muted sm:text-sm">{formatUsdSol(currentBid)}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Time Left
        </p>
        <div className="mt-1">
          <CountdownTimer endTime={auction.end_time} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted">
            {bidCount} {bidCount === 1 ? "Bid" : "Bids"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Top Bidder</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <span className="font-mono text-xs text-zinc-300">
              {topBidder ? shortenAddress(topBidder) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Link href={`/auction/${auction.id}`} className={VIEW_AUCTION_BUTTON_CLASS}>
          View Auction →
        </Link>
      </div>
    </div>
  );
}
