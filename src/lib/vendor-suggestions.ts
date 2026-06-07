import type { VendorDirectoryEntry } from "@/lib/vendors";
import { normalizeSearchQuery } from "@/lib/search";
import { shortenAddress } from "@/lib/format";

export type VendorSuggestion =
  | {
      type: "vendor";
      id: string;
      shopSlug: string;
      shopName: string;
      username: string | null;
      initials: string;
    }
  | {
      type: "category";
      id: string;
      name: string;
      vendorCount: number;
    }
  | {
      type: "item";
      id: string;
      auctionId: string;
      title: string;
      vendorName: string;
      shopSlug: string;
    };

export type VendorSuggestionGroup = {
  label: string;
  items: VendorSuggestion[];
};

function vendorDisplayName(entry: VendorDirectoryEntry) {
  return (
    entry.vendor.shop_name ??
    entry.vendor.username ??
    shortenAddress(entry.vendor.wallet_address)
  );
}

function vendorInitials(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
}

export function buildVendorSuggestions(
  vendors: VendorDirectoryEntry[],
  query: string,
  auctions: { id: string; title: string; seller_wallet: string }[],
  maxTotal = 6
): VendorSuggestionGroup[] {
  const q = normalizeSearchQuery(query);
  if (q.length < 2) return [];

  const vendorByWallet = new Map(
    vendors.map((entry) => [entry.vendor.wallet_address, entry])
  );

  const vendorHits: VendorSuggestion[] = [];
  for (const entry of vendors) {
    const { vendor } = entry;
    const shopName = vendorDisplayName(entry);
    const haystack = [
      shopName,
      vendor.username,
      vendor.bio,
      vendor.shop_description,
      ...entry.categories,
      ...entry.auctionTitles,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (haystack.includes(q)) {
      vendorHits.push({
        type: "vendor",
        id: `vendor-${vendor.wallet_address}`,
        shopSlug: entry.shopSlug,
        shopName,
        username: vendor.username,
        initials: vendorInitials(shopName),
      });
    }
  }

  const categoryCounts = new Map<string, number>();
  for (const entry of vendors) {
    for (const category of entry.categories) {
      if (category.toLowerCase().includes(q)) {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
    }
  }

  const categoryHits: VendorSuggestion[] = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, vendorCount]) => ({
      type: "category" as const,
      id: `category-${name}`,
      name,
      vendorCount,
    }));

  const itemHits: VendorSuggestion[] = [];
  for (const auction of auctions) {
    if (!auction.title.toLowerCase().includes(q)) continue;

    const entry = vendorByWallet.get(auction.seller_wallet);
    if (!entry) continue;

    itemHits.push({
      type: "item",
      id: `item-${auction.id}`,
      auctionId: auction.id,
      title: auction.title,
      vendorName: vendorDisplayName(entry),
      shopSlug: entry.shopSlug,
    });
  }

  const groups: VendorSuggestionGroup[] = [];
  let remaining = maxTotal;

  if (vendorHits.length && remaining > 0) {
    const items = vendorHits.slice(0, remaining);
    groups.push({ label: "Vendors", items });
    remaining -= items.length;
  }

  if (categoryHits.length && remaining > 0) {
    const items = categoryHits.slice(0, remaining);
    groups.push({ label: "Categories", items });
    remaining -= items.length;
  }

  if (itemHits.length && remaining > 0) {
    const items = itemHits.slice(0, remaining);
    groups.push({ label: "Items", items });
  }

  return groups;
}

export function flattenSuggestions(groups: VendorSuggestionGroup[]) {
  return groups.flatMap((group) => group.items);
}
