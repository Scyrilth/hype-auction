import { notFound } from "next/navigation";
import type { Metadata } from "next";

import AuctionDetailError from "@/components/auction/AuctionDetailError";
import AuctionDetailScrollReset from "@/components/auction/AuctionDetailScrollReset";
import AuctionDetailView from "@/components/auction/AuctionDetailView";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { checkAndEndExpiredAuctions } from "@/lib/auction-lifecycle";
import { getAuctionDetailData } from "@/lib/auctions";
import { checkEndingSoonNotifications } from "@/lib/notifications";
import { buildAuctionMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!id?.trim()) return {};

  try {
    const data = await getAuctionDetailData(id);
    if (!data) return {};
    return buildAuctionMetadata(data.auction);
  } catch {
    return {};
  }
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id?.trim()) {
    notFound();
  }

  try {
    await Promise.all([
      checkAndEndExpiredAuctions().catch((error) => {
        console.error("checkAndEndExpiredAuctions", error);
      }),
      checkEndingSoonNotifications().catch((error) => {
        console.error("checkEndingSoonNotifications", error);
      }),
    ]);
  } catch (error) {
    console.error("AuctionDetailPage:lifecycle", error);
  }

  let data;
  try {
    data = await getAuctionDetailData(id);
  } catch (error) {
    console.error("AuctionDetailPage:fetch", error);
    return (
      <AppShell contentClassName="flex-1 overflow-y-auto p-3 sm:p-4">
        <BackButton className="mb-4" />
        <AuctionDetailError />
      </AppShell>
    );
  }

  if (!data) {
    notFound();
  }

  return (
    <AppShell contentClassName="flex-1 overflow-y-auto p-3 sm:p-4">
      <AuctionDetailScrollReset auctionId={id} />
      <BackButton className="mb-4" />
      <AuctionDetailView data={data} />
    </AppShell>
  );
}
