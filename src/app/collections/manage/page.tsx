import ManageCollectionsView from "@/components/collections/ManageCollectionsView";
import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";

export default function ManageCollectionsPage() {
  return (
    <AppShell
      activePath="/collections/manage"
      shellClassName="bg-[#0d0d1a]"
      contentClassName="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5"
    >
      <WalletGate>
        <ManageCollectionsView />
      </WalletGate>
    </AppShell>
  );
}
