"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import SearchSuggestionsDropdown from "@/components/search/SearchSuggestionsDropdown";
import { SearchIcon } from "@/components/icons";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import type { VendorSuggestion } from "@/lib/vendor-suggestions";

export default function BrowseSearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { queryReady, suggestionGroups, flatSuggestions } = useSearchSuggestions({
    query,
    fetchVendors: true,
    scope: "global",
    groupOrder: "global",
  });

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
    <div className="relative">
      <SearchSuggestionsDropdown
        value={query}
        onChange={setQuery}
        onSelect={handleSelect}
        onEnterWithoutSelection={navigateToSearch}
        suggestionGroups={suggestionGroups}
        flatSuggestions={flatSuggestions}
        queryReady={queryReady}
        placeholder="Search auctions, vendors, categories..."
        listboxId="browse-search-suggestions"
        inputClassName="w-full rounded-2xl border border-border bg-surface-elevated py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        leadingSlot={
          <button
            type="button"
            onClick={navigateToSearch}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted transition-colors hover:text-white"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        }
      />
    </div>
  );
}
