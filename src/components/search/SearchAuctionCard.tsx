"use client";

import AuctionCardLink from "@/components/auction/AuctionCardLink";
import AuctionCardPricingFooter from "@/components/auction/AuctionCardPricingFooter";
import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardImage,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import type { AuctionSearchHit } from "@/lib/search";

export default function SearchAuctionCard({
  auction,
}: {
  auction: AuctionSearchHit;
}) {
  const displayBid =
    auction.currentBid > 0 ? auction.currentBid : auction.startPrice;
  const isLive = auction.status === "live";

  return (
    <AuctionCardLink
      href={`/auction/${auction.id}`}
      description={auction.description}
      className="group flex h-full w-full min-w-[12rem] flex-col rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-surface-elevated">
        <AuctionCardImage
          imageUrl={auction.imageUrl}
          title={auction.title}
          category={auction.category}
          auction={{
            title: auction.title,
            category: auction.category,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <WatchlistHeart auctionId={auction.id} />
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle className="group-hover:text-purple-100">
              {auction.title}
            </AuctionCardTitle>
            <AuctionCardCategorySlot category={auction.category} />
            <AuctionLabelBadges
              auction={{
                id: auction.id,
                current_bid: auction.currentBid,
                start_price: auction.startPrice,
                end_time: auction.endTime,
                created_at: auction.createdAt,
                category: auction.category,
                item_details: auction.itemDetails ?? {},
                status: auction.status === "live" ? "live" : "ended",
                is_featured: auction.isFeatured,
              }}
              bidCount={auction.bidCount}
              className="mt-2"
            />
          </>
        }
        footer={
          <AuctionCardPricingFooter
            amount={displayBid}
            shipping={{
              domesticShippingUsd: auction.domesticShippingUsd,
              internationalShippingUsd: auction.internationalShippingUsd,
              isExempt: auction.isDummy,
            }}
            endTime={auction.endTime}
            showTimeLeft={isLive}
            bidCount={auction.bidCount}
          />
        }
      />
    </AuctionCardLink>
  );
}
