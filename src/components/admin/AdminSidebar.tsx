"use client";

import Link from "next/link";

import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";
import { useViewMode } from "@/hooks/useViewMode";
import type { AdminTab } from "@/lib/admin/types";

import { useAdminContext } from "./AdminContext";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flagged", label: "Flagged Orders" },
  { id: "disputes", label: "Disputes" },
  { id: "escrow", label: "Escrow Monitor" },
  { id: "users", label: "User Management" },
];

export default function AdminSidebar() {
  const { activeTab, setActiveTab } = useAdminContext();
  const { exitAdminMode } = useViewMode();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex lg:w-64 lg:px-5">
      <Link
        href="/"
        onClick={() => exitAdminMode()}
        className="mb-4 block"
        aria-label="Back to Hype Auction home"
      >
        <HypeAuctionLogo className="h-9 w-full max-w-[9.5rem]" />
      </Link>
      <div className="mb-5 border-b border-border pb-5" />

      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-300">
        Platform
      </p>
      <p className="mb-5 text-[11px] text-muted">Administration</p>
      <nav className="flex flex-col gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-accent/20 font-medium text-purple-200"
                : "text-muted hover:bg-surface-elevated hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
