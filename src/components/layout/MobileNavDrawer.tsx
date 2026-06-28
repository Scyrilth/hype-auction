"use client";

import { useEffect } from "react";

import AdminViewSwitcher from "@/components/admin/AdminViewSwitcher";
import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";
import SidebarNavContent from "@/components/layout/SidebarNavContent";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function MobileNavDrawer({
  open,
  onClose,
  activePath,
}: {
  open: boolean;
  onClose: () => void;
  activePath?: string;
}) {
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] md:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close navigation menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <div
        className={`fixed left-0 top-0 flex h-full w-[min(18rem,85vw)] flex-col border-r border-border bg-surface px-3 py-4 shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <HypeAuctionLogo className="h-7 w-auto max-w-[8.5rem]" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white"
            aria-label="Close menu"
          >
            <i className="ti ti-x text-lg leading-none" />
          </button>
        </div>

        {isAdmin && (
          <AdminViewSwitcher layout="drawer" onNavigate={onClose} />
        )}

        <SidebarNavContent
          activePath={activePath}
          onNavigate={onClose}
          showLogo={false}
          className="min-h-0 overflow-hidden"
        />
      </div>
    </div>
  );
}
