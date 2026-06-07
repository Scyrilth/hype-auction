import {
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { formatRelativeFuture, formatSol } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

export default function UpcomingAuctions({
  auctions,
}: {
  auctions: Auction[];
}) {
  if (auctions.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="mb-4 text-base font-semibold text-white">
        Upcoming Auctions
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {auctions.map((auction) => {
          const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);

          return (
            <Link
              key={auction.id}
              href={`/auction/${auction.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
            >
              <div className="relative aspect-[4/3] h-auto w-full overflow-hidden bg-surface-elevated">
                <Image
                  src={imageSrc}
                  alt={auction.title}
                  fill
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <AuctionCardContent
                className="p-3.5"
                header={
                  <AuctionCardTitle className="font-medium">
                    {auction.title}
                  </AuctionCardTitle>
                }
                footer={
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted">Starting bid</p>
                      <p className="text-lg font-bold text-accent">
                        {formatSol(auction.start_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Starts in</p>
                      <p className="text-sm font-medium text-white">
                        {formatRelativeFuture(auction.end_time)}
                      </p>
                    </div>
                  </div>
                }
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
