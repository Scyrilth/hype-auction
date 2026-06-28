import type { ReactNode } from "react";

import { SearchIcon } from "@/components/icons";
import SearchAuctionCard from "@/components/search/SearchAuctionCard";
import SearchCategoryCard from "@/components/search/SearchCategoryCard";
import SearchVendorCard from "@/components/search/SearchVendorCard";
import type { GlobalSearchResults } from "@/lib/search";

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
        <SearchIcon className="h-6 w-6 text-accent" />
      </div>
      <p className="mt-5 text-lg font-semibold text-white">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="mt-2 text-sm text-muted">
        Try a different keyword like sneakers, pokemon, vinyl, or a shop name.
      </p>
    </div>
  );
}

export default function SearchResults({
  results,
}: {
  results: GlobalSearchResults;
}) {
  const { query, vendors, liveAuctions, categories, pastAuctions } = results;
  const hasResults =
    vendors.length +
      liveAuctions.length +
      categories.length +
      pastAuctions.length >
    0;

  if (!query) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <SearchIcon className="h-6 w-6 text-accent" />
        </div>
        <p className="mt-5 text-sm text-muted">
          Enter a search term to find vendors, live auctions, and categories.
        </p>
      </div>
    );
  }

  if (!hasResults) {
    return <EmptyState query={query} />;
  }

  return (
    <div className="space-y-10">
      <Section title="Vendors" count={vendors.length}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <SearchVendorCard key={vendor.shopSlug} vendor={vendor} />
          ))}
        </div>
      </Section>

      <Section title="Live Auctions" count={liveAuctions.length}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liveAuctions.map((auction) => (
            <SearchAuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </Section>

      <Section title="Categories" count={categories.length}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <SearchCategoryCard key={category.name} category={category} />
          ))}
        </div>
      </Section>

      <Section title="Past Auctions" count={pastAuctions.length}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pastAuctions.map((auction) => (
            <SearchAuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </Section>
    </div>
  );
}
