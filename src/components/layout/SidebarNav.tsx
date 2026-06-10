"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";
import {
  ChevronDownIcon,
  DashboardLayoutIcon,
  HomeIcon,
  SettingsIcon,
  SolanaLogo,
  StarFilledIcon,
  StoreIcon,
} from "@/components/icons";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { getProfileSlug } from "@/lib/profile-links";

const MY_SHOP_STORAGE_KEY = "hype-sidebar-my-shop-open";

function navLinkClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors ${
    active
      ? "bg-accent/15 font-medium text-accent"
      : "text-zinc-300 hover:bg-surface-elevated hover:text-white"
  }`;
}

function subLinkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-lg py-2 pl-9 pr-2 text-xs transition-colors ${
    active
      ? "font-medium text-accent"
      : "text-muted hover:bg-surface-elevated hover:text-white"
  }`;
}

export default function SidebarNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const { connected, wallet, username, isVendor, loading } = useSidebarUser();
  const { isAdmin } = useIsAdmin();
  const showBecomeVendorCard = connected && !loading && !isVendor;

  const shopSlug = wallet ? getProfileSlug(username, wallet) : null;
  const shopSettingsHref = shopSlug ? `/shop/${shopSlug}` : "/dashboard/settings";

  const shopSubItems = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: DashboardLayoutIcon },
      { href: shopSettingsHref, label: "Shop Settings", icon: SettingsIcon },
      { href: "/dashboard/create", label: "Create Listing", icon: StoreIcon },
      { href: "/transactions", label: "Transactions", icon: null as null },
    ],
    [shopSettingsHref]
  );

  const isShopRoute =
    currentPath.startsWith("/dashboard") ||
    currentPath.startsWith("/transactions") ||
    (shopSlug !== null && currentPath === shopSettingsHref);

  const showMyShop = connected && isVendor;
  const isAdminActive = currentPath.startsWith("/admin");

  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(MY_SHOP_STORAGE_KEY);
    if (stored !== null) {
      setShopOpen(stored === "true");
      return;
    }
    setShopOpen(isShopRoute);
  }, [isShopRoute]);

  const toggleShopOpen = () => {
    setShopOpen((open) => {
      const next = !open;
      localStorage.setItem(MY_SHOP_STORAGE_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    if (isShopRoute) {
      setShopOpen(true);
      localStorage.setItem(MY_SHOP_STORAGE_KEY, "true");
    }
  }, [isShopRoute]);

  const isHomeActive = currentPath === "/";
  const isShopSectionActive = isShopRoute;
  const isMyCollectionsActive =
    currentPath === "/collections/manage" ||
    currentPath.startsWith("/collections/manage/");

  return (
    <aside className="hidden h-full w-[13%] min-w-44 max-w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex lg:px-5 lg:py-6">
      <div className="mb-6">
        <HypeAuctionLogo className="h-9 w-full max-w-[9.5rem]" showTagline />
      </div>

      <nav className="mb-4 flex flex-1 flex-col gap-1 border-b border-border pb-4">
        <Link href="/" className={navLinkClass(isHomeActive)}>
          <HomeIcon className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </Link>

        {showMyShop && (
          <div>
            <button
              type="button"
              onClick={toggleShopOpen}
              className={`${navLinkClass(isShopSectionActive)} w-full justify-between`}
              aria-expanded={shopOpen}
            >
              <span className="flex items-center gap-3">
                <StarFilledIcon className="h-4 w-4 shrink-0 text-accent" />
                <span>My Shop</span>
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                  shopOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {shopOpen && (
              <div className="mt-0.5 space-y-0.5">
                {shopSubItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={subLinkClass(currentPath === href)}
                  >
                    {Icon ? (
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <i className="ti ti-receipt-2 h-3.5 w-3.5 shrink-0 text-base leading-none" />
                    )}
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {connected && wallet && (
          <Link
            href="/collections/manage"
            className={navLinkClass(isMyCollectionsActive)}
          >
            <i className="ti ti-stack-2 h-4 w-4 shrink-0 text-base leading-none" />
            <span>My Collections</span>
          </Link>
        )}

        {isAdmin && (
          <div className="mt-auto border-t border-border/80 pt-3">
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-lg border px-2 py-2.5 text-sm transition-colors ${
                isAdminActive
                  ? "border-accent/40 bg-accent/10 font-medium text-purple-200"
                  : "border-purple-900/50 text-zinc-400 hover:border-accent/30 hover:bg-purple-950/30 hover:text-purple-200"
              }`}
            >
              <i className="ti ti-shield h-4 w-4 shrink-0 text-base leading-none" />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {showBecomeVendorCard && (
        <div className="mt-auto rounded-xl border border-purple-800 bg-purple-950/30 p-3">
          <div className="flex gap-3">
            <StoreIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-sm text-white">Want to sell?</p>
              <p className="mt-0.5 text-xs text-muted">
                Start your shop on Hype Auction
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-2 inline-block text-xs font-medium text-accent transition-colors hover:text-purple-300"
              >
                Become a Vendor →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span>Built on</span>
        <SolanaLogo className="h-4 w-4" />
        <span className="font-semibold tracking-wider text-zinc-400">SOLANA</span>
      </div>
    </aside>
  );
}
