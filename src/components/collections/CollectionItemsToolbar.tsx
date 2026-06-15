"use client";

import {
  type CollectionGradeFilter,
  type CollectionSortOption,
} from "@/lib/collection-filters";

const GRADE_OPTIONS: { value: CollectionGradeFilter; label: string }[] = [
  { value: "all", label: "All grades" },
  { value: "PSA", label: "PSA" },
  { value: "BGS", label: "BGS" },
  { value: "CGC", label: "CGC" },
  { value: "SGC", label: "SGC" },
  { value: "ACE", label: "ACE" },
  { value: "HGA", label: "HGA" },
  { value: "ungraded", label: "Ungraded" },
];

export default function CollectionItemsToolbar({
  sort,
  onSortChange,
  grade,
  onGradeChange,
  category,
  onCategoryChange,
  categories,
  showCategoryFilter = true,
}: {
  sort: CollectionSortOption;
  onSortChange: (value: CollectionSortOption) => void;
  grade: CollectionGradeFilter;
  onGradeChange: (value: CollectionGradeFilter) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  showCategoryFilter?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs text-muted">
        Sort
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as CollectionSortOption)
          }
          className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-white"
        >
          <option value="date">Date added (newest first)</option>
          <option value="value">Estimated value (highest first)</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-muted">
        Grade
        <select
          value={grade}
          onChange={(event) =>
            onGradeChange(event.target.value as CollectionGradeFilter)
          }
          className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-white"
        >
          {GRADE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {showCategoryFilter && categories.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted">
          Category
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-white"
          >
            <option value="all">All categories</option>
            {categories.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
