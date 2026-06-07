import CollectionDetailView from "@/components/collections/CollectionDetailView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d1a]">
      <Sidebar activePath="/collections" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5">
          <CollectionDetailView collectionId={id} />
        </main>
      </div>
    </div>
  );
}
