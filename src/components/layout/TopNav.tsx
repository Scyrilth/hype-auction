"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import WalletNav from "@/components/WalletNav";
import SearchSuggestionsDropdown from "@/components/search/SearchSuggestionsDropdown";
import { BellIcon, SearchIcon } from "@/components/icons";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import type { VendorSuggestion } from "@/lib/vendor-suggestions";

const navLinks = [
  { label: "Browse", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Live", href: "/" },
  { label: "Rewards", href: "#" },
];

export default function TopNav() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  return (
    <header className="flex h-12 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-3 sm:h-14 sm:gap-4 sm:px-4 lg:gap-6 lg:px-5">
      <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[40%] lg:max-w-xl">
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
          inputClassName="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          leadingSlot={
            <button
              type="button"
              onClick={navigateToSearch}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors hover:text-white"
              aria-label="Search"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          }
        />
      </div>

      <nav className="hidden items-center gap-4 lg:flex lg:gap-6">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-white ${
              link.label === "Live" ? "text-accent" : "text-zinc-400"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <WalletNav />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-accent bg-gradient-to-br from-purple-500 to-indigo-600" />
      </div>
    </header>
  );
}
