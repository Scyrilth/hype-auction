"use client";

import AuctionCardLink from "@/components/auction/AuctionCardLink";
import AuctionCardBidLine from "@/components/auction/AuctionCardBidLine";
import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardFooterStats,
  AuctionCardImage,
  AuctionCardShippingLine,
  AuctionCardTimeLeftLabel,
  AuctionCardTitle,
  ViewAuctionButton,
  auctionCardShippingPropsFromAuction,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import type { Auction } from "@/lib/database.types";
import { getEffectiveBid } from "@/lib/parse-auction";

export default function LiveAuctionCard({
  auction,
  bidCount,
  bidCount24h,
  isTopFeaturedByBids,
}: {
  auction: Auction;
  bidCount?: number;
  bidCount24h?: number;
  isTopFeaturedByBids?: boolean;
}) {
  const displayBid = getEffectiveBid(auction);

  return (
    <AuctionCardLink
      href={`/auction/${auction.id}`}
      description={auction.description}
      className="group flex h-full w-full max-w-full min-w-0 flex-col rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-surface-elevated">
        <AuctionCardImage
          imageUrl={auction.image_url}
          title={auction.title}
          category={auction.category}
          auction={auction}
          imageClassName="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
        <WatchlistHeart auctionId={auction.id} />
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle>{auction.title}</AuctionCardTitle>
            <AuctionCardCategorySlot category={auction.category} />
            <AuctionLabelBadges
              auction={{
                id: auction.id,
                current_bid: auction.current_bid,
                start_price: auction.start_price,
                end_time: auction.end_time,
                created_at: auction.created_at,
                category: auction.category,
                item_details: auction.item_details ?? {},
                status: auction.status,
                is_featured: auction.is_featured,
              }}
              bidCount={bidCount}
              bidCount24h={bidCount24h}
              isTopFeaturedByBids={isTopFeaturedByBids}
              className="mt-2"
            />
          </>
        }
        footer={
          <AuctionCardFooterStats
            bidColumn={
              <>
                <p className="whitespace-nowrap text-xs text-muted">Current bid</p>
                <AuctionCardBidLine amount={displayBid} />
                <AuctionCardShippingLine
                  {...auctionCardShippingPropsFromAuction(auction)}
                />
              </>
            }
            timeColumn={
              <>
                <AuctionCardTimeLeftLabel />
                <CountdownTimer endTime={auction.end_time} compact />
              </>
            }
          />
        }
      />

      <div className="px-3 pb-3">
        <ViewAuctionButton
          auctionId={auction.id}
          asSpan
          className="group-hover:bg-accent-hover"
        />
      </div>
    </AuctionCardLink>
  );
}
