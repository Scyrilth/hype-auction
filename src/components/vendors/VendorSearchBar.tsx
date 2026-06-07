"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { SearchIcon } from "@/components/icons";
import {
  buildVendorSuggestions,
  flattenSuggestions,
  type VendorSuggestion,
  type VendorSuggestionGroup,
} from "@/lib/vendor-suggestions";
import { normalizeSearchQuery } from "@/lib/search";
import { supabase } from "@/lib/supabase";
import type { VendorDirectoryEntry } from "@/lib/vendors";

function TagIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function ItemIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function SuggestionRow({
  suggestion,
  isActive,
  onSelect,
  onHover,
}: {
  suggestion: VendorSuggestion;
  isActive: boolean;
  onSelect: (suggestion: VendorSuggestion) => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      onClick={() => onSelect(suggestion)}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-accent/20 text-white"
          : "text-zinc-300 hover:bg-accent/10 hover:text-white"
      }`}
    >
      {suggestion.type === "vendor" && (
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {suggestion.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {suggestion.shopName}
            </span>
            {suggestion.username && (
              <span className="block truncate text-xs text-muted">
                @{suggestion.username}
              </span>
            )}
          </span>
        </>
      )}

      {suggestion.type === "category" && (
        <>
          <TagIcon />
          <span className="min-w-0 flex-1 truncate text-sm">
            {suggestion.name}
          </span>
          <span className="shrink-0 text-xs text-muted">
            {suggestion.vendorCount}{" "}
            {suggestion.vendorCount === 1 ? "vendor" : "vendors"}
          </span>
        </>
      )}

      {suggestion.type === "item" && (
        <>
          <ItemIcon />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {suggestion.title}
            </span>
            <span className="block truncate text-xs text-muted">
              {suggestion.vendorName}
            </span>
          </span>
        </>
      )}
    </button>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [matchingAuctions, setMatchingAuctions] = useState<
    { id: string; title: string; seller_wallet: string }[]
  >([]);

  const queryReady = normalizeSearchQuery(search).length >= 2;

  useEffect(() => {
    if (!queryReady) {
      setMatchingAuctions([]);
      return;
    }

    let cancelled = false;
    const q = normalizeSearchQuery(search);
    const wallets = vendors.map((entry) => entry.vendor.wallet_address);

    async function loadAuctions() {
      const { data, error } = await supabase
        .from("auctions")
        .select("id, title, seller_wallet")
        .in("seller_wallet", wallets)
        .ilike("title", `%${q}%`)
        .limit(20);

      if (!cancelled && !error) {
        setMatchingAuctions(
          (data ?? []) as { id: string; title: string; seller_wallet: string }[]
        );
      }
    }

    loadAuctions();
    return () => {
      cancelled = true;
    };
  }, [search, queryReady, vendors]);

  const suggestionGroups = useMemo(
    () => buildVendorSuggestions(vendors, search, matchingAuctions, 6),
    [vendors, search, matchingAuctions]
  );

  const flatSuggestions = useMemo(
    () => flattenSuggestions(suggestionGroups),
    [suggestionGroups]
  );

  const showDropdown = isOpen && queryReady;

  useEffect(() => {
    setActiveIndex(flatSuggestions.length ? 0 : -1);
  }, [search, flatSuggestions.length]);

  useEffect(() => {
    if (!showDropdown) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showDropdown]);

  const handleSelect = useCallback(
    (suggestion: VendorSuggestion) => {
      setIsOpen(false);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (event.key === "ArrowDown" && queryReady) {
        setIsOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveIndex((index) => (index + 1) % flatSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveIndex((index) =>
        index <= 0 ? flatSuggestions.length - 1 : index - 1
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && flatSuggestions[activeIndex]) {
      event.preventDefault();
      handleSelect(flatSuggestions[activeIndex]);
    }
  };

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, category, or items sold..."
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="vendor-search-suggestions"
        className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />

      {showDropdown && (
        <div
          id="vendor-search-suggestions"
          role="listbox"
          className="vendor-suggestions-dropdown absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
        >
          {flatSuggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No matches found
            </p>
          ) : (
            suggestionGroups.map((group) => (
              <SuggestionGroup
                key={group.label}
                group={group}
                activeIndex={activeIndex}
                getNextIndex={() => {
                  runningIndex += 1;
                  return runningIndex;
                }}
                onSelect={handleSelect}
                onHover={setActiveIndex}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroup({
  group,
  activeIndex,
  getNextIndex,
  onSelect,
  onHover,
}: {
  group: VendorSuggestionGroup;
  activeIndex: number;
  getNextIndex: () => number;
  onSelect: (suggestion: VendorSuggestion) => void;
  onHover: (index: number) => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {group.label}
      </p>
      {group.items.map((suggestion) => {
        const index = getNextIndex();
        return (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            isActive={index === activeIndex}
            onSelect={onSelect}
            onHover={() => onHover(index)}
          />
        );
      })}
    </div>
  );
}
