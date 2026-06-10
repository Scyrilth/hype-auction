"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { connecting } = useWallet();
  const { connected, isAdmin } = useIsAdmin();

  if (connecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Checking wallet...</p>
      </div>
    );
  }

  if (!connected || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="rounded-2xl border border-border bg-surface px-8 py-10">
          <h1 className="text-xl font-bold text-white">Access denied</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">
            This area is restricted to the platform admin wallet.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
