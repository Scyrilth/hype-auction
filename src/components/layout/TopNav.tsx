"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import AdminViewSwitcher from "@/components/admin/AdminViewSwitcher";
import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import WalletNav from "@/components/WalletNav";
import NotificationTray from "@/components/notifications/NotificationTray";
import SearchSuggestionsDropdown from "@/components/search/SearchSuggestionsDropdown";
import { SearchIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNotifications } from "@/hooks/useNotifications";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { shortenAddress } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";
import type { VendorSuggestion } from "@/lib/vendor-suggestions";

const navLinks = [
  { label: "Live", href: "/live", live: true },
  { label: "Browse", href: "/browse" },
  { label: "Collections", href: "/collections" },
  { label: "Vendors", href: "/vendors" },
  { label: "Categories", href: "/categories" },
  { label: "Rewards", href: "/rewards" },
] as const;

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { connected } = useWallet();
  const { isAdmin } = useIsAdmin();
  const { wallet, username, avatarUrl } = useSidebarUser();
  const isAdminRoute = pathname.startsWith("/admin");
  const { count: unreadMessages } = useUnreadMessageCount();
  const { notifications, unreadCount, refresh } = useNotifications();
  const [query, setQuery] = useState("");
  const [trayOpen, setTrayOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const notificationAnchorRef = useRef<HTMLDivElement>(null);

  const { queryReady, suggestionGroups, flatSuggestions } = useSearchSuggestions(
    {
      query,
      fetchVendors: true,
      scope: "global",
      groupOrder: "global",
    }
  );

  const navigateToSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [query, router]);

  const handleSelect = useCallback(
    (suggestion: VendorSuggestion) => {
      if (suggestion.type === "vendor") {
        router.push(`/shop/${suggestion.shopSlug}`);
        return;
      }

      if (suggestion.type === "category") {
        router.push(`/search?q=${encodeURIComponent(suggestion.name)}`);
        setQuery("");
        return;
      }

      router.push(`/shop/${suggestion.shopSlug}`);
    },
    [router]
  );

  const isLinkActive = (href: string) => {
    if (href === "/live") {
      return pathname === "/live" || pathname.startsWith("/live/");
    }

    if (href === "/") return pathname === "/";

    if (href === "/collections") {
      if (pathname === "/collections") return true;
      if (!pathname.startsWith("/collections/")) return false;

      const segment = pathname.slice("/collections/".length).split("/")[0];
      return segment !== "manage" && segment !== "new";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="fixed top-0 right-0 z-50 flex h-12 min-w-0 shrink-0 flex-nowrap items-center gap-1.5 overflow-hidden border-b border-border bg-surface pl-2 pr-3 left-0 sm:gap-2 sm:pl-2.5 md:left-44 lg:gap-2 lg:pr-4">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-surface-elevated hover:text-white md:hidden"
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
        >
          <i className="ti ti-menu-2 text-lg leading-none" aria-hidden />
        </button>

        <HypeAuctionLogo className="h-6 w-auto shrink-0 md:hidden" />

      <div className="relative min-w-0 flex-1 max-w-[11rem] sm:max-w-[13rem] lg:max-w-[14rem] xl:max-w-[16rem]">
        <SearchSuggestionsDropdown
          value={query}
          onChange={setQuery}
          onSelect={handleSelect}
          onEnterWithoutSelection={navigateToSearch}
          suggestionGroups={suggestionGroups}
          flatSuggestions={flatSuggestions}
          queryReady={queryReady}
          placeholder="Search items, users, categories..."
          listboxId="global-search-suggestions"
          inputClassName="w-full min-w-0 rounded-full border border-border bg-background py-1 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          leadingSlot={
            <button
              type="button"
              onClick={navigateToSearch}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors hover:text-white"
              aria-label="Search"
            >
              <SearchIcon className="h-3 w-3" />
            </button>
          }
        />
      </div>

      <nav className="hidden shrink-0 items-center gap-2 whitespace-nowrap lg:flex xl:gap-2.5">
        {navLinks.map((link) => {
          const active = isLinkActive(link.href);
          const isLive = "live" in link && link.live;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-1 border-b-2 pb-0.5 text-xs font-medium transition-colors ${
                active
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-red opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live-red" />
                </span>
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1 pr-1 sm:gap-1.5 sm:pr-0">
        {isAdmin && <AdminViewSwitcher />}

        <WalletNav />

        {connected && wallet && (
          <div ref={notificationAnchorRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setTrayOpen((open) => !open)}
              className="relative flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white"
              aria-label="Notifications"
              aria-expanded={trayOpen}
            >
              <i className="ti ti-bell text-[15px] leading-none" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-live-red px-0.5 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <NotificationTray
              open={trayOpen}
              onClose={() => setTrayOpen(false)}
              anchorRef={notificationAnchorRef}
              wallet={wallet}
              notifications={notifications}
              unreadCount={unreadCount}
              onRefresh={refresh}
            />
          </div>
        )}

        {connected && (
          <Link
            href="/messages"
            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white"
            aria-label="Messages"
          >
            <i className="ti ti-mail text-[15px] leading-none" />
            {unreadMessages > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-live-red px-0.5 text-[9px] font-bold text-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        )}

        {connected && wallet && (
          <Link
            href={getProfileHref(username, wallet)}
            className="flex shrink-0 items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-surface-elevated"
            aria-label="My profile"
          >
            <UserAvatar
              walletAddress={wallet}
              avatarUrl={avatarUrl}
              alt={username ?? "My profile"}
              size="xs"
              className="h-7 w-7 border border-accent"
            />
            <span className="hidden min-w-0 items-center gap-1.5 xl:flex">
              {isAdminRoute && (
                <span className="shrink-0 rounded-full bg-accent/20 px-1 py-0.5 text-[9px] font-bold tracking-wide text-purple-300">
                  ADMIN
                </span>
              )}
              <span className="max-w-[5rem] truncate bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-[11px] font-semibold uppercase tracking-wide text-transparent 2xl:max-w-[7rem]">
                {username?.replace(/^@+/, "").trim().toUpperCase() ||
                  shortenAddress(wallet).toUpperCase()}
              </span>
            </span>
          </Link>
        )}
      </div>
    </header>

      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
