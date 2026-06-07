"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import InfiniteCarouselRow from "@/components/auction/InfiniteCarouselRow";
import { FilterIcon } from "@/components/icons";
import type { Auction } from "@/lib/database.types";

type SortOption = "ending-soon" | "newest" | "highest-bid" | "lowest-bid";

const ROW_SIZE = 5;
const MAX_ROWS = 3;

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "ending-soon", label: "Ending Soon" },
  { id: "newest", label: "Newest" },
  { id: "highest-bid", label: "Highest Bid" },
  { id: "lowest-bid", label: "Lowest Bid" },
];

function getDisplayBid(auction: Auction) {
  return auction.current_bid > 0 ? auction.current_bid : auction.start_price;
}

function sortAuctions(auctions: Auction[], sort: SortOption) {
  const sorted = [...auctions];

  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "highest-bid":
      return sorted.sort((a, b) => getDisplayBid(b) - getDisplayBid(a));
    case "lowest-bid":
      return sorted.sort((a, b) => getDisplayBid(a) - getDisplayBid(b));
    case "ending-soon":
    default:
      return sorted.sort(
        (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
      );
  }
}

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

export default function LiveAuctionsGrid({
  auctions,
}: {
  auctions: Auction[];
}) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("ending-soon");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const auction of auctions) {
      if (auction.category) categories.add(auction.category);
    }
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [auctions]);

  const filteredAuctions = useMemo(() => {
    const filtered =
      categoryFilter === "all"
        ? auctions
        : auctions.filter((auction) => auction.category === categoryFilter);
    return sortAuctions(filtered, sortBy);
  }, [auctions, categoryFilter, sortBy]);

  const filtersActive = categoryFilter !== "all" || sortBy !== "ending-soon";

  const carouselRows = useMemo(() => {
    const rows: Auction[][] = [];
    for (let i = 0; i < filteredAuctions.length; i += ROW_SIZE) {
      rows.push(filteredAuctions.slice(i, i + ROW_SIZE));
      if (rows.length >= MAX_ROWS) break;
    }
    return rows;
  }, [filteredAuctions]);

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

  if (auctions.length === 0) return null;

  return (
    <section id="live-auctions" className="mt-8 scroll-mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-baseline text-2xl font-bold text-white">
          Live Auctions
          <span className="ml-2 text-base font-normal text-muted">
            ({filteredAuctions.length})
          </span>
        </h2>

        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            className="relative flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 text-muted transition-colors hover:border-accent/50 hover:text-white"
            aria-label="Filter and sort auctions"
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
                <div className="space-y-0.5">
                  <FilterOption
                    label="All Categories"
                    selected={categoryFilter === "all"}
                    onSelect={() => setCategoryFilter("all")}
                  />
                  {availableCategories.map((category) => (
                    <FilterOption
                      key={category}
                      label={category}
                      selected={categoryFilter === category}
                      onSelect={() => setCategoryFilter(category)}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Sort by
                </p>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((option) => (
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

      {filteredAuctions.length > 0 ? (
        <div className="space-y-4">
          {carouselRows.map((row, rowIndex) => (
            <InfiniteCarouselRow
              key={`live-row-${rowIndex}-${row.map((auction) => auction.id).join("-")}`}
              variant="live"
              items={row}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No live auctions match your filters.
        </p>
      )}
    </section>
  );
}
