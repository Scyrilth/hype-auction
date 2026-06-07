"use client";

import Image from "next/image";
import Link from "next/link";

import CountdownTimer from "@/components/auction/CountdownTimer";
import type { BuyerBidActivity, BidActivityStatus } from "@/lib/profile";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

function BidStatusBadge({ status }: { status: BidActivityStatus }) {
  switch (status) {
    case "WINNING":
      return (
        <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Winning
        </span>
      );
    case "OUTBID":
      return (
        <span className="rounded-md bg-live-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Outbid
        </span>
      );
    case "WON":
      return (
        <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-900">
          Won 🏆
        </span>
      );
    case "LOST":
    default:
      return (
        <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
          Lost
        </span>
      );
  }
}

function BidActivityCard({ item }: { item: BuyerBidActivity }) {
  const imageSrc = resolveAuctionImageUrl(
    item.auction.image_url,
    item.auction
  );
  const isLive = item.auction.status === "live";

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
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-white">
            {item.auction.title}
          </h3>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <BidStatusBadge status={item.status} />
              {isLive && (
                <CountdownTimer endTime={item.auction.end_time} compact />
              )}
            </div>
            {item.status === "OUTBID" && item.outbidBy > 0 && (
              <p className="text-[11px] font-medium text-live-red">
                Outbid by {formatSol(item.outbidBy)}
              </p>
            )}
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
