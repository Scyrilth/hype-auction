import CreateListingForm from "@/components/dashboard/CreateListingForm";
import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function CreateListingPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/dashboard" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <WalletGate>
            <CreateListingForm />
          </WalletGate>
        </main>
      </div>
    </div>
  );
}
