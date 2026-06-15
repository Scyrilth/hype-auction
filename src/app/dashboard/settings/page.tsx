import { Suspense } from "react";

import VendorSettingsForm from "@/components/dashboard/VendorSettingsForm";
import WalletGate from "@/components/dashboard/WalletGate";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";

export default function VendorSettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/dashboard/settings" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-5">
          <BackButton label="Back to Dashboard" className="mb-4" />
          <WalletGate>
            <div className="mx-auto max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Shop Settings</h1>
                <p className="mt-1 text-sm text-muted">
                  Customize your vendor profile, banner, and social links.
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
                    Loading settings...
                  </div>
                }
              >
                <VendorSettingsForm />
              </Suspense>
            </div>
          </WalletGate>
        </main>
      </div>
    </div>
  );
}
