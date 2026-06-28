import { auctionCategoryMatchesQuery } from "@/lib/categories";
import { normalizeSearchQuery } from "@/lib/search";

export function itemDetailsMatchQuery(
  itemDetails: Record<string, unknown> | null | undefined,
  query: string
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q || !itemDetails) return false;

  for (const [key, value] of Object.entries(itemDetails)) {
    const valueText = String(value ?? "");
    if (key.toLowerCase().includes(q) || valueText.toLowerCase().includes(q)) {
      return true;
    }
  }

  return false;
}

export function auctionMatchesSearchQuery(
  auction: {
    title: string;
    description?: string | null;
    condition?: string | null;
    category?: string | null;
    item_details?: Record<string, string>;
  },
  query: string
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return false;

  if (auction.title.toLowerCase().includes(q)) return true;
  if (auction.description?.toLowerCase().includes(q)) return true;
  if (auction.condition?.toLowerCase().includes(q)) return true;
  if (auctionCategoryMatchesQuery(auction.category, query)) return true;
  return itemDetailsMatchQuery(auction.item_details, query);
}
