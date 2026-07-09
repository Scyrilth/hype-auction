"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import BrowseCategoryGrid from "@/components/browse/BrowseCategoryGrid";
import BrowseSearchHero from "@/components/browse/BrowseSearchHero";
import BrowseSection from "@/components/browse/BrowseSection";
import { FilterIcon } from "@/components/icons";
import {
  BROWSE_LISTING_FILTER_OPTIONS,
  filterBrowseAuctions,
  isBrowseFilterActive,
  sortBrowseAuctions,
  type BrowseListingFilter,
  type BrowseSectionSortOption,
} from "@/lib/browse-filters";
import { getTopFeaturedAuctionIds } from "@/lib/auction-labels";
import type { BrowseAuctionItem, BrowsePageData } from "@/lib/browse";
import { CATEGORIES } from "@/lib/categories";

type SectionKey = "trending" | "endingSoon" | "recentlyListed";

const SECTION_LIMITS: Record<SectionKey, number> = {
  trending: 10,
  endingSoon: 8,
  recentlyListed: 8,
};

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

function buildSectionItems(
  items: BrowseAuctionItem[],
  globalCategory: string,
  listingFilter: BrowseListingFilter,
  sortBy: BrowseSectionSortOption,
  limit: number
) {
  const filtered = filterBrowseAuctions(items, globalCategory, listingFilter);
  return sortBrowseAuctions(filtered, sortBy).slice(0, limit);
}

export default function BrowseView({
  data,
  initialCategory,
}: {
  data: BrowsePageData;
  initialCategory?: string;
}) {
  const [globalCategory, setGlobalCategory] = useState(
    initialCategory?.trim() || "all"
  );
  const [listingFilter, setListingFilter] = useState<BrowseListingFilter>("all");
  const [sectionSorts, setSectionSorts] = useState<
    Record<SectionKey, BrowseSectionSortOption>
  >({
    trending: "most-bids",
    endingSoon: "most-bids",
    recentlyListed: "most-bids",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const filtersActive = isBrowseFilterActive(globalCategory, listingFilter);

  const labelMaps = useMemo(() => {
    const bidCounts24h = new Map(
      data.auctions.map((item) => [item.auction.id, item.bidCount24h])
    );
    const bidCounts = new Map(
      data.auctions.map((item) => [item.auction.id, item.bidCount])
    );

    return {
      bidCounts24h,
      bidCounts,
      topFeaturedIds: getTopFeaturedAuctionIds(
        data.auctions.map((item) => ({
          id: item.auction.id,
          bidCount24h: item.bidCount24h,
        }))
      ),
    };
  }, [data.auctions]);

  const trendingItems = useMemo(
    () =>
      buildSectionItems(
        data.auctions,
        globalCategory,
        listingFilter,
        sectionSorts.trending,
        SECTION_LIMITS.trending
      ),
    [data.auctions, globalCategory, listingFilter, sectionSorts.trending]
  );

  const endingSoon = useMemo(
    () =>
      buildSectionItems(
        data.auctions,
        globalCategory,
        listingFilter,
        sectionSorts.endingSoon,
        SECTION_LIMITS.endingSoon
      ).map((item) => item.auction),
    [data.auctions, globalCategory, listingFilter, sectionSorts.endingSoon]
  );

  const recentlyListed = useMemo(
    () =>
      buildSectionItems(
        data.auctions,
        globalCategory,
        listingFilter,
        sectionSorts.recentlyListed,
        SECTION_LIMITS.recentlyListed
      ).map((item) => item.auction),
    [data.auctions, globalCategory, listingFilter, sectionSorts.recentlyListed]
  );

  const updateSectionSort = (
    section: SectionKey,
    sort: BrowseSectionSortOption
  ) => {
    setSectionSorts((current) => ({ ...current, [section]: sort }));
  };

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
    <div className="mx-auto max-w-7xl space-y-10 lg:space-y-7">
      <header className="space-y-6 lg:space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white lg:text-2xl">Browse</h1>
          <p className="mt-1 text-sm text-muted lg:mt-0.5 lg:text-xs">
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
              className="relative flex h-12 items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-3 text-muted transition-colors hover:border-accent/50 hover:text-white lg:h-10 lg:rounded-xl"
              aria-label="Filter browse results by category"
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
                <div className="p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Category
                  </p>
                  <div className="max-h-64 space-y-0.5 overflow-y-auto">
                    <FilterOption
                      label="All Categories"
                      selected={globalCategory === "all"}
                      onSelect={() => setGlobalCategory("all")}
                    />
                    {CATEGORIES.map((category) => (
                      <FilterOption
                        key={category.id}
                        label={category.label}
                        selected={globalCategory === category.label}
                        onSelect={() => setGlobalCategory(category.label)}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Listing type
                  </p>
                  <div className="space-y-0.5">
                    {BROWSE_LISTING_FILTER_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.id}
                        label={option.label}
                        selected={listingFilter === option.id}
                        onSelect={() => setListingFilter(option.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-4 lg:space-y-3">
        <h2 className="text-xl font-bold text-white lg:text-lg">Categories</h2>
        <BrowseCategoryGrid categories={CATEGORIES} liveCounts={data.liveCounts} />
      </section>

      <BrowseSection
        title="Trending Now"
        count={trendingItems.length}
        variant="trending"
        trendingItems={trendingItems}
        labelMaps={labelMaps}
        sortBy={sectionSorts.trending}
        onSortChange={(sort) => updateSectionSort("trending", sort)}
      />

      <BrowseSection
        title="Ending Soon"
        count={endingSoon.length}
        auctions={endingSoon}
        labelMaps={labelMaps}
        sortBy={sectionSorts.endingSoon}
        onSortChange={(sort) => updateSectionSort("endingSoon", sort)}
      />

      <BrowseSection
        title="Recently Listed"
        count={recentlyListed.length}
        auctions={recentlyListed}
        labelMaps={labelMaps}
        sortBy={sectionSorts.recentlyListed}
        onSortChange={(sort) => updateSectionSort("recentlyListed", sort)}
      />
    </div>
  );
}
