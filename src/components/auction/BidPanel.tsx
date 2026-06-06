import CountdownTimer from "@/components/auction/CountdownTimer";
import type { Auction } from "@/lib/database.types";
import { formatSol, formatUsdSol, shortenAddress } from "@/lib/format";

interface BidPanelProps {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

export default function BidPanel({ auction, bidCount, topBidder }: BidPanelProps) {
  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const nextBid = displayBid + 0.1;

  return (
    <div className="flex w-64 shrink-0 flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Current Bid
        </p>
        <p className="mt-1 text-3xl font-bold text-white">{formatSol(displayBid)}</p>
        <p className="text-sm text-muted">{formatUsdSol(displayBid)}</p>
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

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Place Bid {formatSol(nextBid)}
        </button>
        <button
          type="button"
          className="w-full rounded-full border border-border py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-accent hover:text-white"
        >
          Quick Bid +0.10 SOL
        </button>
      </div>
    </div>
  );
}
