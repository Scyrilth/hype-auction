import AuctionCardLink from "@/components/auction/AuctionCardLink";
import AuctionCardPricingFooter from "@/components/auction/AuctionCardPricingFooter";
import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardContent,
  AuctionCardImage,
  AuctionCardTitle,
  auctionCardShippingPropsFromAuction,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import type { Auction } from "@/lib/database.types";

export default function TrendingAuctionCard({
  auction,
  bidCount24h,
  bidCount,
  isTopFeaturedByBids,
  reserveLabelSpace = false,
}: {
  auction: Auction;
  bidCount24h: number;
  bidCount?: number;
  isTopFeaturedByBids?: boolean;
  reserveLabelSpace?: boolean;
}) {
  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;

  return (
    <AuctionCardLink
      href={`/auction/${auction.id}`}
      description={auction.description}
      className="group flex h-full w-full min-w-[12rem] flex-col rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-surface-elevated">
        <AuctionCardImage
          imageUrl={auction.image_url}
          title={auction.title}
          category={auction.category}
          auction={auction}
        />
        <WatchlistHeart auctionId={auction.id} />
        {bidCount24h > 0 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            🔥 {bidCount24h} {bidCount24h === 1 ? "bid" : "bids"}
          </span>
        )}
      </div>

      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle className="group-hover:text-purple-100">
              {auction.title}
            </AuctionCardTitle>
            <AuctionLabelBadges
              auction={{
                id: auction.id,
                current_bid: auction.current_bid,
                start_price: auction.start_price,
                end_time: auction.end_time,
                created_at: auction.created_at,
                category: auction.category,
                item_details: auction.item_details,
                status: auction.status,
                is_featured: auction.is_featured,
              }}
              bidCount={bidCount}
              bidCount24h={bidCount24h}
              isTopFeaturedByBids={isTopFeaturedByBids}
              reserveLabelSpace={reserveLabelSpace}
              className="mt-2"
            />
          </>
        }
        footer={
          <AuctionCardPricingFooter
            amount={displayBid}
            shipping={auctionCardShippingPropsFromAuction(auction)}
            endTime={auction.end_time}
            showTimeLeft
            bidCount={bidCount}
          />
        }
      />
    </AuctionCardLink>
  );
}
