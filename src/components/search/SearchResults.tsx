import Link from "next/link";
import type { ReactNode } from "react";

import type { GlobalSearchResults } from "@/lib/search";
import { formatSol } from "@/lib/format";

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
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-white">
        {title}{" "}
        <span className="text-sm font-normal text-muted">({count})</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ResultLink({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        )}
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-purple-300">
          {badge}
        </span>
      )}
    </Link>
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
        <p className="text-sm text-muted">
          Enter a search term to find vendors, live auctions, and categories.
        </p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
        <p className="text-lg font-semibold text-white">No results found</p>
        <p className="mt-2 text-sm text-muted">
          Nothing matched &ldquo;{query}&rdquo;. Try a different keyword like
          sneakers, pokemon, or a shop name.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Vendors" count={vendors.length}>
        {vendors.map((vendor) => (
          <ResultLink
            key={vendor.shopSlug}
            href={`/shop/${vendor.shopSlug}`}
            title={vendor.shopName}
            subtitle={
              vendor.username
                ? `@${vendor.username}${vendor.categories.length ? ` · ${vendor.categories.join(", ")}` : ""}`
                : vendor.categories.join(", ") || undefined
            }
            badge={
              vendor.isVerified
                ? "Verified"
                : vendor.isLive
                  ? "Live"
                  : undefined
            }
          />
        ))}
      </Section>

      <Section title="Live Auctions" count={liveAuctions.length}>
        {liveAuctions.map((auction) => (
          <ResultLink
            key={auction.id}
            href={`/shop/${auction.shopSlug}`}
            title={auction.title}
            subtitle={auction.category ?? "Live auction"}
            badge={formatSol(auction.currentBid)}
          />
        ))}
      </Section>

      <Section title="Categories" count={categories.length}>
        {categories.map((category) => (
          <ResultLink
            key={category.name}
            href={`/search?q=${encodeURIComponent(category.name)}`}
            title={category.name}
            subtitle={`${category.count} auction${category.count === 1 ? "" : "s"}`}
          />
        ))}
      </Section>

      <Section title="Past Auctions" count={pastAuctions.length}>
        {pastAuctions.map((auction) => (
          <ResultLink
            key={auction.id}
            href={`/shop/${auction.shopSlug}`}
            title={auction.title}
            subtitle={auction.category ?? "Ended auction"}
            badge={formatSol(auction.currentBid)}
          />
        ))}
      </Section>
    </div>
  );
}
