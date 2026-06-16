import DashboardView from "@/components/dashboard/DashboardView";
import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell
      activePath="/dashboard"
      contentClassName="flex-1 overflow-y-auto p-5"
    >
      <WalletGate>
        <DashboardView />
      </WalletGate>
    </AppShell>
  );
}
