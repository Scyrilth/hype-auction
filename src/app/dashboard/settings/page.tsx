import { Suspense } from "react";

import VendorSettingsForm from "@/components/dashboard/VendorSettingsForm";
import WalletGate from "@/components/dashboard/WalletGate";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";

export default function VendorSettingsPage() {
  return (
    <AppShell
      activePath="/dashboard/settings"
      contentClassName="flex-1 overflow-y-auto p-4"
    >
      <BackButton label="Back to Dashboard" className="mb-4" />
      <WalletGate>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white">Shop Settings</h1>
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
    </AppShell>
  );
}
