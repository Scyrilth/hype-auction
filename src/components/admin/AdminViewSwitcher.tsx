"use client";

import Link from "next/link";

import { useViewMode } from "@/hooks/useViewMode";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { getProfileHref } from "@/lib/profile-links";

export default function AdminViewSwitcher({
  layout = "inline",
  onNavigate,
}: {
  layout?: "inline" | "drawer";
  onNavigate?: () => void;
}) {
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

  const drawerButtonClass = (mode: "admin" | "seller" | "buyer") =>
    `rounded-lg px-2 py-2 text-center text-xs font-medium transition-colors ${
      activePill === mode
        ? "bg-accent text-white"
        : "border border-border bg-background text-zinc-300 hover:border-accent/40 hover:text-white"
    }`;

  if (layout === "drawer") {
    return (
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        <Link
          href="/admin"
          className={drawerButtonClass("admin")}
          onClick={() => {
            setViewMode("admin");
            onNavigate?.();
          }}
        >
          Admin
        </Link>
        <Link
          href="/dashboard"
          className={drawerButtonClass("seller")}
          onClick={() => {
            setViewMode("seller");
            onNavigate?.();
          }}
        >
          Seller
        </Link>
        <Link
          href={profileHref}
          className={drawerButtonClass("buyer")}
          onClick={() => {
            setViewMode("buyer");
            onNavigate?.();
          }}
        >
          Buyer
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 items-center rounded-full border border-border bg-background p-px md:flex">
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
