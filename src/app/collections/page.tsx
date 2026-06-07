import CollectionsDiscoveryView from "@/components/collections/CollectionsDiscoveryView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import {
  getPublicCollections,
  type CollectionWithOwner,
} from "@/lib/collections";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  let collections: CollectionWithOwner[] = [];

  try {
    collections = await getPublicCollections();
  } catch {
    collections = [];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d1a]">
      <Sidebar activePath="/collections" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5">
          <CollectionsDiscoveryView initialCollections={collections} />
        </main>
      </div>
    </div>
  );
}
