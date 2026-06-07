import Link from "next/link";

import type { CategoryDefinition } from "@/lib/categories";

export default function BrowseCategoryGrid({
  categories,
  liveCounts,
}: {
  categories: CategoryDefinition[];
  liveCounts: Record<string, number>;
}) {
  return (
    <div className="browse-category-grid grid gap-3 sm:gap-4">
      {categories.map((category) => {
        const liveCount = liveCounts[category.label] ?? 0;

        return (
          <Link
            key={category.id}
            href={`/search?q=${encodeURIComponent(category.label)}`}
            className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-surface-elevated"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl" aria-hidden>
                {category.emoji}
              </span>
              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                {liveCount} live
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold text-white group-hover:text-purple-100">
              {category.label}
            </h2>
          </Link>
        );
      })}
    </div>
  );
}
