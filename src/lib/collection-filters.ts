import type { CollectionItem } from "@/lib/collections";

export type CollectionSortOption = "date" | "value" | "name";
export type CollectionGradeFilter =
  | "all"
  | "PSA"
  | "BGS"
  | "CGC"
  | "SGC"
  | "ACE"
  | "HGA"
  | "ungraded";

export function sortCollectionItems(
  items: CollectionItem[],
  sort: CollectionSortOption
): CollectionItem[] {
  const sorted = [...items];

  switch (sort) {
    case "value":
      return sorted.sort(
        (a, b) => (b.estimated_value_sol ?? 0) - (a.estimated_value_sol ?? 0)
      );
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "date":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function filterCollectionItems(
  items: CollectionItem[],
  grade: CollectionGradeFilter,
  category: string
): CollectionItem[] {
  return items.filter((item) => {
    const gradeMatch =
      grade === "all"
        ? true
        : grade === "ungraded"
          ? !item.grading_company
          : item.grading_company === grade;

    const categoryMatch =
      category === "all" ? true : item.category?.toLowerCase() === category.toLowerCase();

    return gradeMatch && categoryMatch;
  });
}

export function getCollectionItemCategories(items: CollectionItem[]): string[] {
  const categories = new Set<string>();
  for (const item of items) {
    if (item.category?.trim()) categories.add(item.category.trim());
  }
  return [...categories].sort((a, b) => a.localeCompare(b));
}
