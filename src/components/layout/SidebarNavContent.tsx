"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";
import {
  ChevronDownIcon,
  DashboardLayoutIcon,
  GridIcon,
  HomeIcon,
  SettingsIcon,
  SolanaLogo,
  StarFilledIcon,
  StoreIcon,
  TagIcon,
} from "@/components/icons";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { useViewMode } from "@/hooks/useViewMode";
import { getProfileSlug } from "@/lib/profile-links";
import {
  shouldShowMyCollectionsInSidebar,
  shouldShowMyShopInSidebar,
} from "@/lib/view-mode";

const MY_SHOP_STORAGE_KEY = "hype-sidebar-my-shop-open";

export const sidebarLegalLinks = [
  { href: "/tos", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/faq", label: "FAQ" },
] as const;

const mobileDrawerNavLinks = [
  { href: "/live", label: "Live", live: true as const },
  { href: "/browse", label: "Browse", icon: "grid" as const },
  { href: "/collections", label: "Collections", icon: "layers" as const },
  { href: "/vendors", label: "Vendors", icon: "store" as const },
  { href: "/categories", label: "Categories", icon: "tag" as const },
  { href: "/rewards", label: "Rewards", icon: "gift" as const },
] as const;

function isMobileDrawerNavLinkActive(pathname: string, href: string) {
  if (href === "/live") {
    return pathname === "/live" || pathname.startsWith("/live/");
  }

  if (href === "/collections") {
    if (pathname === "/collections") return true;
    if (!pathname.startsWith("/collections/")) return false;

    const segment = pathname.slice("/collections/".length).split("/")[0];
    return segment !== "manage" && segment !== "new";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileDrawerNavLinkIcon({
  icon,
}: {
  icon: "grid" | "layers" | "store" | "tag" | "gift";
}) {
  switch (icon) {
    case "grid":
      return <GridIcon className="h-3 w-3 shrink-0" />;
    case "layers":
      return <i className="ti ti-layers-linked h-3 w-3 shrink-0 text-sm leading-none" />;
    case "store":
      return <StoreIcon className="h-3 w-3 shrink-0" />;
    case "tag":
      return <TagIcon className="h-3 w-3 shrink-0" />;
    case "gift":
      return <i className="ti ti-gift h-3 w-3 shrink-0 text-sm leading-none" />;
    default:
      return null;
  }
}

function navLinkClass(active: boolean) {
  return `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
    active
      ? "bg-accent/15 font-medium text-accent"
      : "text-zinc-300 hover:bg-surface-elevated hover:text-white"
  }`;
}

function subLinkClass(active: boolean) {
  return `flex items-center gap-1.5 whitespace-nowrap rounded-lg py-1 pl-6 pr-2 text-[11px] transition-colors ${
    active
      ? "font-medium text-accent"
      : "text-muted hover:bg-surface-elevated hover:text-white"
  }`;
}

export default function SidebarNavContent({
  activePath,
  onNavigate,
  showLogo = true,
  showMobileNavLinks = false,
  className = "",
}: {
  activePath?: string;
  onNavigate?: () => void;
  showLogo?: boolean;
  showMobileNavLinks?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const { connected, wallet, username, isVendor, loading } = useSidebarUser();
  const { isAdmin } = useIsAdmin();
  const { sidebarMode, setViewMode } = useViewMode();
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

  const showMyShop = shouldShowMyShopInSidebar(sidebarMode, connected, isVendor);
  const showMyCollections = shouldShowMyCollectionsInSidebar(
    sidebarMode,
    connected,
    Boolean(wallet)
  );
  const isAdminActive = currentPath.startsWith("/admin");

  const showStandaloneTransactions =
    connected && wallet && !loading && (!isVendor || !showMyShop);
  const transactionsHref =
    isVendor && (sidebarMode === "seller" || sidebarMode === "default")
      ? "/transactions"
      : "/transactions?mode=buying";
  const isTransactionsActive =
    currentPath === "/transactions" || currentPath.startsWith("/transactions/");

  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
      if (typeof window !== "undefined") {
        localStorage.setItem(MY_SHOP_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    <div className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      {showLogo ? (
        <div className="mb-3 w-full shrink-0 -mx-2 bg-gradient-to-b from-[#2d1b69] to-transparent lg:-mx-2.5">
          <div className="px-2 py-3 lg:px-2.5">
            <HypeAuctionLogo imageClassName="h-16 w-16" variant="sidebar" />
          </div>
        </div>
      ) : null}

      <nav className="mb-2 flex flex-1 flex-col gap-0.5 overflow-y-auto border-b border-border pb-2">
        <Link href="/" className={navLinkClass(isHomeActive)} onClick={onNavigate}>
          <HomeIcon className="h-3 w-3 shrink-0" />
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
              <span className="flex items-center gap-2">
                <StarFilledIcon className="h-3 w-3 shrink-0 text-accent" />
                <span>My Shop</span>
              </span>
              <ChevronDownIcon
                className={`h-3 w-3 shrink-0 text-muted transition-transform duration-200 ${
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
                    onClick={onNavigate}
                  >
                    {Icon ? (
                      <Icon className="h-3 w-3 shrink-0" />
                    ) : (
                      <i className="ti ti-receipt-2 h-3 w-3 shrink-0 text-sm leading-none" />
                    )}
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {showMyCollections && (
          <Link
            href="/collections/manage"
            className={navLinkClass(isMyCollectionsActive)}
            onClick={onNavigate}
          >
            <i className="ti ti-stack-2 h-3 w-3 shrink-0 text-sm leading-none" />
            <span>My Collections</span>
          </Link>
        )}

        {showStandaloneTransactions && (
          <Link
            href={transactionsHref}
            className={navLinkClass(isTransactionsActive)}
            onClick={onNavigate}
          >
            <i className="ti ti-receipt-2 h-3 w-3 shrink-0 text-sm leading-none" />
            <span>Transactions</span>
          </Link>
        )}

        {showMobileNavLinks &&
          mobileDrawerNavLinks.map((link) => {
            const active = isMobileDrawerNavLinkActive(currentPath, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass(active)}
                onClick={onNavigate}
              >
                {"live" in link && link.live ? (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-red opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-live-red" />
                  </span>
                ) : "icon" in link ? (
                  <MobileDrawerNavLinkIcon icon={link.icon} />
                ) : null}
                <span>{link.label}</span>
              </Link>
            );
          })}

        {isAdmin && (
          <div className="mt-auto border-t border-border/80 pt-1.5">
            <Link
              href="/admin"
              onClick={() => {
                setViewMode("admin");
                onNavigate?.();
              }}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                isAdminActive
                  ? "border-accent/40 bg-accent/10 font-medium text-purple-200"
                  : "border-purple-900/50 text-zinc-400 hover:border-accent/30 hover:bg-purple-950/30 hover:text-purple-200"
              }`}
            >
              <i className="ti ti-shield h-3 w-3 shrink-0 text-sm leading-none" />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {showBecomeVendorCard && (
        <div className="mt-auto shrink-0 rounded-xl border border-purple-800 bg-purple-950/30 p-2">
          <div className="flex gap-2">
            <StoreIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-xs text-white">Want to sell?</p>
              <p className="mt-0.5 text-[11px] text-muted">
                Start your shop on Hype Auction
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-1.5 inline-block text-[11px] font-medium text-accent transition-colors hover:text-purple-300"
                onClick={onNavigate}
              >
                Become a Vendor →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 shrink-0 space-y-1.5">
        <nav aria-label="Legal" className="flex flex-col gap-0.5 text-[11px] text-muted">
          {sidebarLegalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-400"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span>Built on</span>
          <SolanaLogo className="h-3 w-3" />
          <span className="font-semibold tracking-wider text-zinc-400">
            SOLANA
          </span>
        </div>
      </div>
    </div>
  );
}
