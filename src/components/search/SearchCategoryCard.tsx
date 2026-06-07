import Link from "next/link";

import { getCategoryByLabel } from "@/lib/categories";
import type { CategorySearchHit } from "@/lib/search";

export default function SearchCategoryCard({
  category,
}: {
  category: CategorySearchHit;
}) {
  const definition = getCategoryByLabel(category.name);
  const emoji = definition?.emoji ?? "🏷️";

  return (
    <Link
      href={`/search?q=${encodeURIComponent(category.name)}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-950/40 to-background opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <span className="text-4xl" aria-hidden>
          {emoji}
        </span>
        <h3 className="mt-4 text-base font-semibold text-white group-hover:text-purple-100">
          {category.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {category.count} auction{category.count === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
