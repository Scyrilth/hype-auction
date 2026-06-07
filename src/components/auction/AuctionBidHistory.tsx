"use client";

import { CrownIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import type { BidWithBidder } from "@/lib/auctions";
import { formatSol, formatTimeAgo, shortenAddress } from "@/lib/format";

export default function AuctionBidHistory({
  bids,
  topBidder,
}: {
  bids: BidWithBidder[];
  topBidder: string | null;
}) {
  if (bids.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Bid History
        </h2>
        <p className="mt-4 text-sm text-muted">No bids yet. Be the first!</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Bid History
      </h2>

      <ul className="mt-4 divide-y divide-border">
        {bids.map((bid) => {
          const isTop = topBidder === bid.bidder_wallet;
          const label =
            bid.bidder_username?.replace(/^@+/, "") ||
            shortenAddress(bid.bidder_wallet, 4);

          return (
            <li
              key={bid.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                {isTop ? (
                  <CrownIcon className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <span className="inline-block h-4 w-4 shrink-0" />
                )}
                <UserAvatar
                  walletAddress={bid.bidder_wallet}
                  alt={label}
                  size="xs"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {bid.bidder_username ? `@${label}` : label}
                  </p>
                  <p className="text-xs text-muted">
                    {formatTimeAgo(bid.created_at)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-accent">
                {formatSol(bid.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
