"use client";

import { useRouter } from "next/navigation";

import { useViewMode } from "@/hooks/useViewMode";
import { shortenAddress } from "@/lib/format";

import { useAdminContext } from "./AdminContext";

export default function AdminTopBar({ wallet }: { wallet: string }) {
  const router = useRouter();
  const { exitAdminMode } = useViewMode();
  const { showDummyData, setShowDummyData } = useAdminContext();

  const handleBackToSite = () => {
    exitAdminMode();
    router.push("/");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleBackToSite}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-white"
        >
          <i className="ti ti-arrow-left text-base leading-none" />
          Back to site
        </button>
        <h1 className="text-lg font-bold tracking-tight text-white">
          Hype Auction Admin
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-muted">{shortenAddress(wallet, 6)}</span>
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
