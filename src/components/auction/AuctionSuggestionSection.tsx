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

      <div className="-mx-1 w-full min-w-0 max-w-full overflow-x-hidden px-1 pb-2">
        <div className="horizontal-scroll-row flex gap-3 overflow-x-auto sm:gap-4">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="horizontal-scroll-item w-[220px] min-w-0 shrink-0"
            >
              <div className="w-full">
                <BrowseAuctionCard
                  auction={auction}
                  {...getAuctionCardLabelProps(auction.id, labelMaps)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
