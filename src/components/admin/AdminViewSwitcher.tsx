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
    `rounded-full px-1.5 py-px text-[10px] font-medium leading-tight transition-colors ${
      activePill === mode
        ? "bg-accent text-white"
        : "text-muted hover:bg-surface-elevated hover:text-white"
    }`;

  return (
    <div className="flex shrink-0 items-center rounded-full border border-border bg-background p-px">
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
