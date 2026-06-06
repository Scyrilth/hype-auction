import BidPanel from "@/components/auction/BidPanel";
import LiveChat from "@/components/auction/LiveChat";
import LiveStream from "@/components/auction/LiveStream";
import UpcomingAuctions from "@/components/auction/UpcomingAuctions";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-5">
          <div className="flex gap-4">
            <LiveStream />
            <BidPanel />
            <LiveChat />
          </div>

          <UpcomingAuctions />
        </main>
      </div>
    </div>
  );
}
