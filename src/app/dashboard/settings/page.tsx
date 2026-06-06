import VendorSettingsForm from "@/components/dashboard/VendorSettingsForm";
import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function VendorSettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/dashboard/settings" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-5">
          <WalletGate>
            <div className="mx-auto max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Shop Settings</h1>
                <p className="mt-1 text-sm text-muted">
                  Customize your vendor profile, banner, and social links.
                </p>
              </div>

              <VendorSettingsForm />
            </div>
          </WalletGate>
        </main>
      </div>
    </div>
  );
}
