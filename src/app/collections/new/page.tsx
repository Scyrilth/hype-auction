import CreateCollectionForm from "@/components/collections/CreateCollectionForm";
import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";

export default function NewCollectionPage() {
  return (
    <AppShell
      activePath="/collections/manage"
      shellClassName="bg-[#0d0d1a]"
      contentClassName="flex-1 overflow-y-auto bg-[#0d0d1a] p-3 sm:p-4"
    >
      <BackButton className="mb-4" />
      <h1 className="mb-6 text-xl font-bold text-white">
        Create Collection
      </h1>
      <WalletGate>
        <CreateCollectionForm />
      </WalletGate>
    </AppShell>
  );
}
