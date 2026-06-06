import BidPanel from "@/components/auction/BidPanel";
import LiveChat from "@/components/auction/LiveChat";
import LiveStream from "@/components/auction/LiveStream";
import type { LiveAuctionView } from "@/lib/auctions";

export default function FeaturedAuctionSection({
  featured,
}: {
  featured: LiveAuctionView;
}) {
  return (
    <div className="featured-auction-grid w-full">
      <div className="featured-auction-video min-h-0 min-w-0">
        <LiveStream auction={featured.auction} />
      </div>
      <div className="featured-auction-bid min-h-0 min-w-0">
        <BidPanel
          key={featured.auction.id}
          auction={featured.auction}
          bidCount={featured.bidCount}
          topBidder={featured.topBidder}
        />
      </div>
      <div className="featured-auction-chat min-h-0 min-w-0">
        <LiveChat auctionId={featured.auction.id} />
      </div>
    </div>
  );
}
