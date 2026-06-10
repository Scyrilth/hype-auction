import Link from "next/link";

import BrowseAuctionCard from "@/components/browse/BrowseAuctionCard";
import {
  getAuctionCardLabelProps,
  type AuctionLabelMaps,
} from "@/lib/auction-labels";
import type { Auction } from "@/lib/database.types";

export default function AuctionSuggestionSection({
  title,
  viewAllHref,
  auctions,
  labelMaps,
}: {
  title: string;
  viewAllHref?: string;
  auctions: Auction[];
  labelMaps?: AuctionLabelMaps;
}) {
  if (!auctions.length) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            View all →
          </Link>
        ) : null}
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:gap-4">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="w-[11.5rem] shrink-0 snap-start sm:w-[14rem]"
          >
            <BrowseAuctionCard
              auction={auction}
              {...getAuctionCardLabelProps(auction.id, labelMaps)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
