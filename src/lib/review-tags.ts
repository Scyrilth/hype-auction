export const REVIEW_TAG_OPTIONS = [
  { id: "as_described", label: "✅ Item as Described" },
  { id: "great_packaging", label: "📦 Great Packaging" },
  { id: "fast_shipping", label: "🚀 Fast Shipping" },
  { id: "great_communication", label: "💬 Great Communication" },
  { id: "would_buy_again", label: "🔁 Would Buy Again" },
  { id: "not_as_described", label: "⚠️ Item Not as Described" },
  { id: "slow_shipping", label: "🐌 Slow Shipping" },
  { id: "poor_packaging", label: "📦 Poor Packaging" },
] as const;

export type ReviewTagId = (typeof REVIEW_TAG_OPTIONS)[number]["id"];

export function getReviewTagLabel(id: string): string {
  return REVIEW_TAG_OPTIONS.find((tag) => tag.id === id)?.label ?? id;
}
