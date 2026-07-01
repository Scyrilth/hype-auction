import BrowseView from "@/components/browse/BrowseView";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { getBrowsePageData } from "@/lib/browse";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Browse Auctions — Hype Auction",
  description:
    "Discover live auctions, categories, and trending collectibles on Hype Auction.",
  path: "/browse",
});

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const data = await getBrowsePageData();

  return (
    <AppShell
      activePath="/browse"
      contentClassName="flex-1 overflow-y-auto p-3 sm:p-4"
    >
      <BackButton className="mb-4" />
      <BrowseView data={data} initialCategory={params.category} />
    </AppShell>
  );
}
