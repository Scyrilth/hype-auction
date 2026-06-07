import Image from "next/image";
import Link from "next/link";

import type { BuyerBidActivity } from "@/lib/profile";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

function StatusBadge({ status }: { status: BuyerBidActivity["status"] }) {
  if (status === "WON") {
    return (
      <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
        Won
      </span>
    );
  }

  if (status === "LIVE") {
    return (
      <span className="flex items-center gap-1 rounded-md bg-live-red px-2 py-0.5 text-[10px] font-bold uppercase text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Live
      </span>
    );
  }

  return (
    <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
      Ended
    </span>
  );
}

function BidActivityCard({ item }: { item: BuyerBidActivity }) {
  const imageSrc = resolveAuctionImageUrl(
    item.auction.image_url,
    item.auction
  );

  return (
    <Link
      href={`/auction/${item.auction.id}`}
      className="flex gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-elevated sm:h-24 sm:w-24">
        <Image
          src={imageSrc}
          alt={item.auction.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {item.auction.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {item.isWinner && (
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                Won
              </span>
            )}
            <StatusBadge status={item.status} />
          </div>
        </div>

        {item.auction.category && (
          <span className="mt-2 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
            {item.auction.category}
          </span>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted">Your highest bid</p>
            <p className="font-semibold text-accent">
              {formatSol(item.userHighestBid)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Current bid</p>
            <p className="font-semibold text-white">
              {formatSol(item.currentBid)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProfileBidActivityList({
  items,
  emptyMessage,
}: {
  items: BuyerBidActivity[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <BidActivityCard key={item.auction.id} item={item} />
      ))}
    </div>
  );
}
