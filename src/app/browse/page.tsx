import BrowseView from "@/components/browse/BrowseView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import { getBrowsePageData } from "@/lib/browse";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const data = await getBrowsePageData();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/browse" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <BrowseView data={data} initialCategory={params.category} />
        </main>
      </div>
    </div>
  );
}
