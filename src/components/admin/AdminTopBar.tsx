"use client";

import AdminViewSwitcher from "@/components/admin/AdminViewSwitcher";
import { shortenAddress } from "@/lib/format";

import { useAdminContext } from "./AdminContext";

export default function AdminTopBar({ wallet }: { wallet: string }) {
  const { showDummyData, setShowDummyData } = useAdminContext();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
      <div>
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <p className="font-mono text-xs text-muted">{shortenAddress(wallet, 6)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <AdminViewSwitcher />
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs text-zinc-300">
        <input
          type="checkbox"
          checked={showDummyData}
          onChange={(e) => setShowDummyData(e.target.checked)}
          className="accent-accent"
        />
        Show dummy data
        </label>
      </div>
    </header>
  );
}
