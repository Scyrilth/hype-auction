"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ChevronDownIcon,
  DashboardLayoutIcon,
  HomeIcon,
  LightningIcon,
  SettingsIcon,
  SolanaLogo,
  StarFilledIcon,
  StoreIcon,
} from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { getProfileHref } from "@/lib/profile-links";

const MY_SHOP_STORAGE_KEY = "hype-sidebar-my-shop-open";

const shopSubItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardLayoutIcon },
  { href: "/dashboard/settings", label: "Shop Settings", icon: SettingsIcon },
] as const;

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
  const showBecomeVendorCard = connected && !loading && !isVendor;

  const isShopRoute = currentPath.startsWith("/dashboard");

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

  const profileHref = wallet ? getProfileHref(username, wallet) : "/";
  const isProfileActive =
    !!wallet &&
    (currentPath === profileHref || currentPath.startsWith(`${profileHref}/`));
  const isHomeActive = currentPath === "/";
  const isShopSectionActive = isShopRoute;

  return (
    <aside className="hidden h-full w-[13%] min-w-44 max-w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex lg:px-5 lg:py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-[0_0_16px_rgba(124,58,237,0.45)]">
            <LightningIcon className="h-4 w-4" />
          </div>
          <span className="bg-gradient-to-r from-white via-purple-200 to-accent bg-clip-text text-sm font-bold tracking-wide text-transparent">
            HYPE AUCTION
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted">Live Auctions. On Solana.</p>
      </div>

      <nav className="mb-4 flex flex-1 flex-col gap-1 border-b border-border pb-4">
        {connected && wallet && (
          <Link href={profileHref} className={navLinkClass(isProfileActive)}>
            <UserAvatar
              walletAddress={wallet}
              alt="My profile"
              size="xs"
              className="border border-border"
            />
            <span>My Profile</span>
          </Link>
        )}

        <Link href="/" className={navLinkClass(isHomeActive)}>
          <HomeIcon className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </Link>

        <Link
          href="/collections"
          className={navLinkClass(
            currentPath === "/collections" ||
              (currentPath.startsWith("/collections/") &&
                !currentPath.startsWith("/collections/manage"))
          )}
        >
          <i className="ti ti-stack-2 h-4 w-4 shrink-0 text-base leading-none" />
          <span>Collections</span>
        </Link>

        {connected && wallet && (
          <Link
            href="/collections/manage"
            className={subLinkClass(currentPath === "/collections/manage")}
          >
            <i className="ti ti-folder h-3.5 w-3.5 shrink-0 text-base leading-none" />
            <span>My Collections</span>
          </Link>
        )}

        {connected && isVendor && (
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
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
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
