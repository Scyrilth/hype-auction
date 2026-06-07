import Image from "next/image";
import Link from "next/link";

import CountdownTimer from "@/components/auction/CountdownTimer";
import type { Auction } from "@/lib/database.types";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

export default function ShopAuctionGrid({
  auctions,
  emptyMessage,
  showCountdown = false,
}: {
  auctions: Auction[];
  emptyMessage: string;
  showCountdown?: boolean;
}) {
  if (auctions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {auctions.map((auction) => {
        const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);
        const displayBid =
          auction.current_bid > 0 ? auction.current_bid : auction.start_price;

        return (
          <Link
            key={auction.id}
            href={`/auction/${auction.id}`}
            className="block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
          >
            <div className="relative aspect-[4/3] bg-surface-elevated">
              <Image
                src={imageSrc}
                alt={auction.title}
                fill
                className="object-cover"
                unoptimized
              />
              {auction.status === "live" && (
                <span className="absolute left-3 top-3 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
                  Live
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-white">
                {auction.title}
              </h3>
              {auction.category && (
                <span className="mt-2 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                  {auction.category}
                </span>
              )}
              <p className="mt-3 text-lg font-bold text-accent">
                {formatSol(displayBid)}
              </p>
              {showCountdown && (
                <p className="mt-1 text-xs text-muted">
                  Ends in <CountdownTimer endTime={auction.end_time} compact />
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
