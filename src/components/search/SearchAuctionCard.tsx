"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import CountdownTimer from "@/components/auction/CountdownTimer";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { AuctionSearchHit } from "@/lib/search";
import { formatSol } from "@/lib/format";

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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {auction.status === "live" && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}

        {auction.status === "ended" && (
          <span className="absolute left-3 top-3 rounded-md bg-surface-elevated/90 px-2 py-0.5 text-xs font-semibold uppercase text-muted">
            Ended
          </span>
        )}
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle className="group-hover:text-purple-100">
              {auction.title}
            </AuctionCardTitle>
            <AuctionCardCategorySlot category={auction.category} />
          </>
        }
        footer={
          <>
            <p className="mb-2 text-xs text-muted">
              {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
            </p>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Current bid</p>
                <p className="text-lg font-bold text-accent">
                  {formatSol(displayBid)}
                </p>
              </div>

              {auction.status === "live" && (
                <div className="text-right">
                  <p className="text-xs text-muted">Time left</p>
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
