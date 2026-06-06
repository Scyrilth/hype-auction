"use client";

import { useMemo, useState } from "react";

import { SearchIcon } from "@/components/icons";
import VendorCard from "@/components/vendors/VendorCard";
import { matchesVendorEntry } from "@/lib/search";
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
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOption>("followers");

  const filtered = useMemo(() => {
    const result = vendors.filter(
      (entry) =>
        matchesVendorEntry(entry, search) && applyFilter(entry, activeTab)
    );
    return sortEntries(result, sort);
  }, [vendors, search, activeTab, sort]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Discover Vendors
        </h1>
        <p className="mt-1 text-sm text-muted">
          Browse verified sellers, live streamers, and top-rated shops on
          LIVEAUCTION.
        </p>
      </header>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category, or items sold..."
          className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

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
              ? "No vendor shops yet. Enable your shop in Settings to appear here."
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
