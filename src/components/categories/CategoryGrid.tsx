import Link from "next/link";

import type { CategoryDefinition } from "@/lib/categories";

export default function CategoryGrid({
  categories,
  liveCounts,
}: {
  categories: CategoryDefinition[];
  liveCounts: Map<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => {
        const liveCount = liveCounts.get(category.label) ?? 0;

        return (
          <Link
            key={category.id}
            href={`/search?q=${encodeURIComponent(category.label)}`}
            className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl" aria-hidden>
                {category.emoji}
              </span>
              {liveCount > 0 && (
                <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
                  {liveCount} live
                </span>
              )}
            </div>

            <h2 className="mt-4 text-base font-semibold text-white group-hover:text-purple-100">
              {category.label}
            </h2>

            <p className="mt-1 text-sm text-muted">
              {liveCount === 0
                ? "No live auctions"
                : `${liveCount} live auction${liveCount === 1 ? "" : "s"}`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
