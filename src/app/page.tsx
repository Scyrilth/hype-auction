import AuctionEmptyState from "@/components/auction/AuctionEmptyState";
import FeaturedAuctionSection from "@/components/auction/FeaturedAuctionSection";
import LiveAuctionsGrid from "@/components/auction/LiveAuctionsGrid";
import TrendingSection from "@/components/auction/TrendingSection";
import LiveChat from "@/components/auction/LiveChat";
import UpcomingAuctions from "@/components/auction/UpcomingAuctions";
import HomepageHero from "@/components/home/HomepageHero";
import AppShell from "@/components/layout/AppShell";
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
    <AppShell contentClassName="flex-1 p-3 sm:p-4 lg:p-5">
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
    </AppShell>
  );
}
