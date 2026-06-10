"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getProfileHref } from "@/lib/profile-links";
import { useSidebarUser } from "@/hooks/useSidebarUser";

export default function AdminViewSwitcher() {
  const pathname = usePathname();
  const { username, wallet } = useSidebarUser();

  if (!wallet) return null;

  const profileHref = getProfileHref(username, wallet);
  const isAdmin = pathname.startsWith("/admin");
  const isSeller =
    pathname.startsWith("/dashboard") || pathname.startsWith("/transactions");
  const isBuyer = pathname.startsWith("/profile");

  const pillClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-accent text-white"
        : "text-muted hover:bg-surface-elevated hover:text-white"
    }`;

  return (
    <div className="flex items-center rounded-full border border-border bg-background p-1">
      <Link href="/admin" className={pillClass(isAdmin)}>
        Admin
      </Link>
      <Link href="/dashboard" className={pillClass(isSeller && !isAdmin)}>
        Seller
      </Link>
      <Link href={profileHref} className={pillClass(isBuyer)}>
        Buyer
      </Link>
    </div>
  );
}
