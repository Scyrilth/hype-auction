import ManageCollectionsView from "@/components/collections/ManageCollectionsView";
import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function ManageCollectionsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d1a]">
      <Sidebar activePath="/collections/manage" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5">
          <WalletGate>
            <ManageCollectionsView />
          </WalletGate>
        </main>
      </div>
    </div>
  );
}
