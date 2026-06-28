import CreateListingForm from "@/components/dashboard/CreateListingForm";
import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";

export default function CreateListingPage() {
  return (
    <AppShell
      activePath="/dashboard/create"
      contentClassName="flex-1 overflow-y-auto p-3 sm:p-4"
    >
      <BackButton label="Back to Dashboard" className="mb-4" />
      <WalletGate>
        <CreateListingForm />
      </WalletGate>
    </AppShell>
  );
}
