import CollectionsDiscoveryView from "@/components/collections/CollectionsDiscoveryView";
import AppShell from "@/components/layout/AppShell";
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
    <AppShell
      activePath="/collections"
      shellClassName="bg-[#0d0d1a]"
      contentClassName="flex-1 overflow-y-auto bg-[#0d0d1a] p-3 sm:p-4"
    >
      <CollectionsDiscoveryView initialCollections={collections} />
    </AppShell>
  );
}
