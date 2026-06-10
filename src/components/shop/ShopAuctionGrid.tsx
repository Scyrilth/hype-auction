import Image from "next/image";
import Link from "next/link";

import {
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardShippingLine,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import FiatValue from "@/components/ui/FiatValue";
import type { Auction } from "@/lib/database.types";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

export default function ShopAuctionGrid({
  auctions,
  emptyMessage,
  showCountdown = false,
  bidCounts,
  bidCounts24h,
  topFeaturedIds,
}: {
  auctions: Auction[];
  emptyMessage: string;
  showCountdown?: boolean;
  bidCounts?: Map<string, number>;
  bidCounts24h?: Map<string, number>;
  topFeaturedIds?: Set<string>;
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
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
          >
            <div className="w-full h-48 overflow-hidden bg-surface-elevated">
              <Image
                src={imageSrc}
                alt={auction.title}
                width={800}
                height={192}
                className="h-full w-full object-cover object-center"
                unoptimized
              />
            </div>
            <AuctionCardContent
              header={
                <>
                  <AuctionCardTitle>{auction.title}</AuctionCardTitle>
                  <AuctionCardCategorySlot category={auction.category} />
                  <AuctionLabelBadges
                    auction={auction}
                    bidCount={bidCounts?.get(auction.id)}
                    bidCount24h={bidCounts24h?.get(auction.id)}
                    isTopFeaturedByBids={topFeaturedIds?.has(auction.id)}
                    className="mt-2"
                  />
                </>
              }
              footer={
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">Current bid</p>
                    <p className="text-lg font-bold text-accent">
                      {formatSol(displayBid)}
                    </p>
                    <AuctionCardShippingLine
                      domesticShippingUsd={auction.domestic_shipping_usd}
                    />
                    <FiatValue solAmount={displayBid} />
                  </div>
                  {showCountdown && (
                    <div className="text-right">
                      <p className="text-xs text-muted">Time left</p>
                      <CountdownTimer endTime={auction.end_time} compact />
                    </div>
                  )}
                </div>
              }
            />
          </Link>
        );
      })}
    </div>
  );
}
