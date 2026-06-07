import { notFound } from "next/navigation";

import AuctionDetailView from "@/components/auction/AuctionDetailView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import { checkAndEndExpiredAuctions } from "@/lib/auction-lifecycle";
import { getAuctionDetailData } from "@/lib/auctions";

export const dynamic = "force-dynamic";

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await checkAndEndExpiredAuctions();
  const data = await getAuctionDetailData(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <AuctionDetailView data={data} />
        </main>
      </div>
    </div>
  );
}
