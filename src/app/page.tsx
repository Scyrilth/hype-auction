import AuctionEmptyState from "@/components/auction/AuctionEmptyState";
import FeaturedAuctionSection from "@/components/auction/FeaturedAuctionSection";
import LiveAuctionsGrid from "@/components/auction/LiveAuctionsGrid";
import TrendingSection from "@/components/auction/TrendingSection";
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
    <AppShell contentClassName="flex-1 p-2.5 sm:p-3 lg:p-4">
      <HomepageHero />

      <div id="homepage-listings">
        {featured ? (
          <>
            <FeaturedAuctionSection featured={featured} />
            <TrendingSection items={trending} labelMaps={labelMaps} />
            <LiveAuctionsGrid auctions={otherLive} labelMaps={labelMaps} />
          </>
        ) : (
          <AuctionEmptyState />
        )}

        <UpcomingAuctions auctions={upcomingAuctions} />
      </div>
    </AppShell>
  );
}
