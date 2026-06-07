"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import SearchSuggestionsDropdown from "@/components/search/SearchSuggestionsDropdown";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import type { VendorSuggestion } from "@/lib/vendor-suggestions";
import type { VendorDirectoryEntry } from "@/lib/vendors";

export default function VendorSearchBar({
  vendors,
  search,
  onSearchChange,
  onCategorySelect,
}: {
  vendors: VendorDirectoryEntry[];
  search: string;
  onSearchChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
}) {
  const router = useRouter();

  const { queryReady, suggestionGroups, flatSuggestions } = useSearchSuggestions(
    {
      query: search,
      vendors,
      scope: "vendor-wallets",
      groupOrder: "vendor-directory",
    }
  );

  const handleSelect = useCallback(
    (suggestion: VendorSuggestion) => {
      if (suggestion.type === "vendor") {
        router.push(`/shop/${suggestion.shopSlug}`);
        return;
      }

      if (suggestion.type === "category") {
        onCategorySelect(suggestion.name);
        onSearchChange("");
        return;
      }

      router.push(`/shop/${suggestion.shopSlug}`);
    },
    [router, onCategorySelect, onSearchChange]
  );

  return (
    <SearchSuggestionsDropdown
      value={search}
      onChange={onSearchChange}
      onSelect={handleSelect}
      suggestionGroups={suggestionGroups}
      flatSuggestions={flatSuggestions}
      queryReady={queryReady}
      placeholder="Search by name, category, or items sold..."
      listboxId="vendor-search-suggestions"
      inputClassName="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
    />
  );
}
