import BidPanel from "@/components/auction/BidPanel";
import LiveStream from "@/components/auction/LiveStream";
import type { LiveAuctionView } from "@/lib/auctions";

export default function FeaturedAuctionSection({
  featured,
}: {
  featured: LiveAuctionView;
}) {
  return (
    <section className="w-full">
      <div className="featured-heading mb-4 flex items-center gap-3">
        <h2 className="featured-heading-text text-3xl font-bold text-white">
          Featured
        </h2>
        <span
          className="h-7 w-1 rounded-full bg-accent shadow-[0_0_14px_rgba(124,58,237,0.75)]"
          aria-hidden
        />
      </div>

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
      </div>
    </section>
  );
}
