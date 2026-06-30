"use client";

import { useEffect, useMemo, useState } from "react";

import VendorCard from "@/components/vendors/VendorCard";
import VendorSearchBar from "@/components/vendors/VendorSearchBar";
import {
  filterVendorEntries,
  getSellerWalletsWithMatchingAuctionTitles,
} from "@/lib/search";
import type { VendorDirectoryEntry } from "@/lib/vendors";

type FilterTab = "all" | "verified" | "top-rated" | "most-followers";
type SortOption = "followers" | "rating" | "sales" | "newest";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "verified", label: "Verified" },
  { id: "top-rated", label: "Top Rated" },
  { id: "most-followers", label: "Most Followers" },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "followers", label: "Most Followers" },
  { id: "rating", label: "Top Rated" },
  { id: "sales", label: "Most Sales" },
  { id: "newest", label: "Newest" },
];

function applyFilter(entry: VendorDirectoryEntry, tab: FilterTab) {
  switch (tab) {
    case "verified":
      return entry.vendor.is_verified;
    case "top-rated":
      return entry.averageRating >= 4;
    case "most-followers":
      return entry.vendor.followers_count > 0;
    default:
      return true;
  }
}

function sortEntries(entries: VendorDirectoryEntry[], sort: SortOption) {
  const sorted = [...entries];

  sorted.sort((a, b) => {
    switch (sort) {
      case "followers":
        return b.vendor.followers_count - a.vendor.followers_count;
      case "rating":
        return b.averageRating - a.averageRating;
      case "sales":
        return b.totalSales - a.totalSales;
      case "newest":
        return (
          new Date(b.vendor.created_at).getTime() -
          new Date(a.vendor.created_at).getTime()
        );
      default:
        return 0;
    }
  });

  return sorted;
}

export default function VendorDirectory({
  vendors,
}: {
  vendors: VendorDirectoryEntry[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOption>("followers");
  const [titleMatchWallets, setTitleMatchWallets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTitleMatches() {
      if (!search.trim()) {
        setTitleMatchWallets(new Set());
        return;
      }

      try {
        const wallets = await getSellerWalletsWithMatchingAuctionTitles(search);
        if (!cancelled) setTitleMatchWallets(wallets);
      } catch {
        if (!cancelled) setTitleMatchWallets(new Set());
      }
    }

    loadTitleMatches();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filtered = useMemo(() => {
    let result = filterVendorEntries(vendors, search, titleMatchWallets);

    if (categoryFilter) {
      result = result.filter((entry) =>
        entry.categories.some(
          (category) => category.toLowerCase() === categoryFilter.toLowerCase()
        )
      );
    }

    result = result.filter((entry) => applyFilter(entry, activeTab));
    return sortEntries(result, sort);
  }, [vendors, search, titleMatchWallets, categoryFilter, activeTab, sort]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Discover Vendors
        </h1>
        <p className="mt-1 text-sm text-muted">
          Browse verified sellers, live streamers, and top-rated shops on
          LIVEAUCTION.
        </p>
      </header>

      <VendorSearchBar
        vendors={vendors}
        search={search}
        onSearchChange={setSearch}
        onCategorySelect={setCategoryFilter}
      />

      {categoryFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Filtered by category:</span>
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-purple-200 transition-colors hover:bg-accent/20"
          >
            {categoryFilter}
            <span aria-hidden className="text-muted">
              ×
            </span>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "border border-border bg-surface text-zinc-300 hover:border-accent/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="vendor-sort" className="text-xs text-muted">
            Sort by
          </label>
          <select
            id="vendor-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {vendors.length === 0
              ? "No vendors yet — be the first to start selling!"
              : "No vendors match your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <VendorCard key={entry.vendor.wallet_address} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
