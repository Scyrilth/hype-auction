"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import CollectionCard from "@/components/collections/CollectionCard";
import { CATEGORIES } from "@/lib/categories";
import type { CollectionWithOwner } from "@/lib/collections";

export default function CollectionsDiscoveryView({
  initialCollections,
}: {
  initialCollections: CollectionWithOwner[];
}) {
  const { connected } = useWallet();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return initialCollections.filter((collection) => {
      const matchesCategory =
        category === "All" || collection.categories.includes(category);
      const matchesSearch =
        !term ||
        collection.name.toLowerCase().includes(term) ||
        (collection.description?.toLowerCase().includes(term) ?? false);

      return matchesCategory && matchesSearch;
    });
  }, [category, initialCollections, search]);

  const categoryOptions = ["All", ...CATEGORIES.map((c) => c.label)];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Collections</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Discover curated collections from collectors around the world
          </p>
        </div>
        {connected && (
          <Link
            href="/collections/new"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Create Collection
          </Link>
        )}
      </div>

      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search collections by name or description..."
          className="w-full rounded-full border border-white/10 bg-[#1a1835] px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {categoryOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCategory(option)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              category === option
                ? "bg-accent text-white"
                : "border border-white/10 bg-[#1a1835] text-zinc-300 hover:border-accent/40 hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <p className="text-base font-semibold text-white">No collections found</p>
          <p className="mt-2 text-sm text-muted">
            Try a different search or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
