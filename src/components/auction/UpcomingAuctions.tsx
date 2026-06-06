import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";
import { formatRelativeFuture, formatSol } from "@/lib/format";
import Image from "next/image";

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
            <article
              key={auction.id}
              className="group overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                <Image
                  src={imageSrc}
                  alt={auction.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="p-3.5">
                <h3 className="truncate text-sm font-medium text-white">
                  {auction.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-accent">
                  Starting {formatSol(auction.start_price)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Starts in {formatRelativeFuture(auction.end_time)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
