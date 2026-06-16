import CollectionDetailView from "@/components/collections/CollectionDetailView";
import AppShell from "@/components/layout/AppShell";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell
      activePath="/collections"
      shellClassName="bg-[#0d0d1a]"
      contentClassName="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5"
    >
      <CollectionDetailView collectionId={id} />
    </AppShell>
  );
}
