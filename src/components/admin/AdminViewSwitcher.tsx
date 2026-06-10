"use client";

import Link from "next/link";

import { useViewMode } from "@/hooks/useViewMode";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { getProfileHref } from "@/lib/profile-links";

export default function AdminViewSwitcher() {
  const { activePill, setViewMode } = useViewMode();
  const { username, wallet } = useSidebarUser();

  if (!wallet) return null;

  const profileHref = getProfileHref(username, wallet);

  const pillClass = (mode: "admin" | "seller" | "buyer") =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      activePill === mode
        ? "bg-accent text-white"
        : "text-muted hover:bg-surface-elevated hover:text-white"
    }`;

  return (
    <div className="flex items-center rounded-full border border-border bg-background p-1">
      <Link
        href="/admin"
        className={pillClass("admin")}
        onClick={() => setViewMode("admin")}
      >
        Admin
      </Link>
      <Link
        href="/dashboard"
        className={pillClass("seller")}
        onClick={() => setViewMode("seller")}
      >
        Seller
      </Link>
      <Link
        href={profileHref}
        className={pillClass("buyer")}
        onClick={() => setViewMode("buyer")}
      >
        Buyer
      </Link>
    </div>
  );
}
