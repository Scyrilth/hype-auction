import CreateCollectionForm from "@/components/collections/CreateCollectionForm";
import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";

export default function NewCollectionPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d1a]">
      <Sidebar activePath="/collections/manage" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5">
          <BackButton className="mb-4" />
          <h1 className="mb-6 text-2xl font-bold text-white">
            Create Collection
          </h1>
          <WalletGate>
            <CreateCollectionForm />
          </WalletGate>
        </main>
      </div>
    </div>
  );
}
