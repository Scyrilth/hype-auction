"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import BrowseCategoryGrid from "@/components/browse/BrowseCategoryGrid";
import BrowseSearchHero from "@/components/browse/BrowseSearchHero";
import BrowseSection from "@/components/browse/BrowseSection";
import { FilterIcon } from "@/components/icons";
import {
  BROWSE_SORT_OPTIONS,
  filterBrowseAuctions,
  isBrowseFilterActive,
  sortBrowseAuctions,
  type BrowseSortOption,
} from "@/lib/browse-filters";
import type { BrowsePageData } from "@/lib/browse";
import { CATEGORIES } from "@/lib/categories";

function FilterOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        selected
          ? "bg-accent/20 font-medium text-white"
          : "text-foreground hover:bg-surface"
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          selected ? "bg-accent" : "bg-transparent"
        }`}
        aria-hidden
      />
      {label}
    </button>
  );
}

export default function BrowseView({ data }: { data: BrowsePageData }) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<BrowseSortOption>("trending");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const filtersActive = isBrowseFilterActive(categoryFilter, sortBy);

  const filtered = useMemo(
    () => filterBrowseAuctions(data.auctions, categoryFilter),
    [data.auctions, categoryFilter]
  );

  const trendingItems = useMemo(
    () =>
      sortBrowseAuctions(
        filtered,
        sortBy === "trending" ? "trending" : sortBy
      ).slice(0, 10),
    [filtered, sortBy]
  );
  const endingSoon = useMemo(
    () =>
      sortBrowseAuctions(
        filtered,
        sortBy === "trending" ? "ending-soon" : sortBy
      )
        .slice(0, 8)
        .map((item) => item.auction),
    [filtered, sortBy]
  );
  const recentlyListed = useMemo(
    () =>
      sortBrowseAuctions(
        filtered,
        sortBy === "trending" ? "recently-listed" : sortBy
      )
        .slice(0, 8)
        .map((item) => item.auction),
    [filtered, sortBy]
  );

  useEffect(() => {
    if (!filterOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [filterOpen]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Browse</h1>
          <p className="mt-1 text-sm text-muted">
            Discover live auctions, categories, and trending items.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <BrowseSearchHero />
          </div>

          <div ref={filterRef} className="relative shrink-0 pt-1">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className="relative flex h-12 items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-3 text-muted transition-colors hover:border-accent/50 hover:text-white"
              aria-label="Filter browse results"
              aria-expanded={filterOpen}
              aria-haspopup="true"
            >
              <span className="text-sm">Filter</span>
              <span className="relative">
                <FilterIcon className="h-4 w-4" />
                {filtersActive && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-surface-elevated" />
                )}
              </span>
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl">
                <div className="border-b border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Category
                  </p>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    <FilterOption
                      label="All Categories"
                      selected={categoryFilter === "all"}
                      onSelect={() => setCategoryFilter("all")}
                    />
                    {CATEGORIES.map((category) => (
                      <FilterOption
                        key={category.id}
                        label={category.label}
                        selected={categoryFilter === category.label}
                        onSelect={() => setCategoryFilter(category.label)}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Sort by
                  </p>
                  <div className="space-y-0.5">
                    {BROWSE_SORT_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.id}
                        label={option.label}
                        selected={sortBy === option.id}
                        onSelect={() => setSortBy(option.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Categories</h2>
        <BrowseCategoryGrid categories={CATEGORIES} liveCounts={data.liveCounts} />
      </section>

      <BrowseSection
        title="Trending Now"
        count={trendingItems.length}
        variant="trending"
        trendingItems={trendingItems}
      />

      <BrowseSection
        title="Ending Soon"
        count={endingSoon.length}
        auctions={endingSoon}
      />

      <BrowseSection
        title="Recently Listed"
        count={recentlyListed.length}
        auctions={recentlyListed}
      />
    </div>
  );
}
