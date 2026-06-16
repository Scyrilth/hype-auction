import BrowseView from "@/components/browse/BrowseView";
import AppShell from "@/components/layout/AppShell";
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
    <AppShell
      activePath="/browse"
      contentClassName="flex-1 overflow-y-auto p-4 sm:p-5"
    >
      <BackButton className="mb-4" />
      <BrowseView data={data} initialCategory={params.category} />
    </AppShell>
  );
}
