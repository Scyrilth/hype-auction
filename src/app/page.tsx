import AuctionEmptyState from "@/components/auction/AuctionEmptyState";
import FeaturedAuctionSection from "@/components/auction/FeaturedAuctionSection";
import LiveAuctionsGrid from "@/components/auction/LiveAuctionsGrid";
import TrendingSection from "@/components/auction/TrendingSection";
import LiveChat from "@/components/auction/LiveChat";
import UpcomingAuctions from "@/components/auction/UpcomingAuctions";
import HomepageHero from "@/components/home/HomepageHero";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { checkAndEndExpiredAuctions } from "@/lib/auction-lifecycle";
import { checkEndingSoonNotifications } from "@/lib/notifications";
import { getAuctionsPageData, getTrendingAuctions } from "@/lib/auctions";

export const dynamic = "force-dynamic";

export default async function Home() {
  await Promise.all([
    checkAndEndExpiredAuctions(),
    checkEndingSoonNotifications(),
  ]);

  const [
    { featured, otherLive, upcomingAuctions, bidCounts, bidCounts24h, topFeaturedIds },
    trending,
  ] = await Promise.all([getAuctionsPageData(), getTrendingAuctions(10)]);

  const labelMaps = { bidCounts, bidCounts24h, topFeaturedIds };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <HomepageHero />

          <div id="homepage-listings">
          {featured ? (
            <>
              <FeaturedAuctionSection featured={featured} />
              <TrendingSection items={trending} labelMaps={labelMaps} />
              <LiveAuctionsGrid auctions={otherLive} labelMaps={labelMaps} />
            </>
          ) : (
            <div className="featured-auction-grid w-full">
              <div className="featured-auction-video min-w-0">
                <AuctionEmptyState />
              </div>
              <div className="featured-auction-chat min-w-0">
                <LiveChat />
              </div>
            </div>
          )}

          <UpcomingAuctions auctions={upcomingAuctions} />
          </div>
        </main>
      </div>
    </div>
  );
}
