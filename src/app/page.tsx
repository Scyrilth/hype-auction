import AuctionEmptyState from "@/components/auction/AuctionEmptyState";
import BidPanel from "@/components/auction/BidPanel";
import LiveChat from "@/components/auction/LiveChat";
import LiveStream from "@/components/auction/LiveStream";
import UpcomingAuctions from "@/components/auction/UpcomingAuctions";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { getAuctionsPageData } from "@/lib/auctions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { liveAuction, upcomingAuctions } = await getAuctionsPageData();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-5">
          {liveAuction ? (
            <div className="flex gap-4">
              <LiveStream auction={liveAuction.auction} />
              <BidPanel
                auction={liveAuction.auction}
                bidCount={liveAuction.bidCount}
                topBidder={liveAuction.topBidder}
              />
              <LiveChat />
            </div>
          ) : (
            <div className="flex gap-4">
              <AuctionEmptyState />
              <div className="hidden w-64 shrink-0 lg:block" />
              <LiveChat />
            </div>
          )}

          <UpcomingAuctions auctions={upcomingAuctions} />
        </main>
      </div>
    </div>
  );
}
