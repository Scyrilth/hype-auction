import type { VendorDirectoryEntry } from "@/lib/vendors";
import {
  auctionCategoryMatchesQuery,
  countVendorsForCategoryLabel,
  findMatchingCategories,
  vendorCategoriesMatchQuery,
} from "@/lib/categories";
import { normalizeSearchQuery } from "@/lib/search";
import { shortenAddress } from "@/lib/format";

export type AuctionSuggestionSource = {
  id: string;
  title: string;
  category: string | null;
  seller_wallet: string;
  current_bid: number;
  status: string;
  end_time: string;
  bid_count: number;
};

export type VendorSuggestion =
  | {
      type: "vendor";
      id: string;
      shopSlug: string;
      shopName: string;
      username: string | null;
      initials: string;
      followersCount: number;
      averageRating: number;
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
      currentBid: number;
      bidCount: number;
      isLive: boolean;
    };

export type VendorSuggestionGroup = {
  label: string;
  items: VendorSuggestion[];
};

export type SuggestionGroupOrder = "vendor-directory" | "global";

const GROUP_ORDER: Record<
  SuggestionGroupOrder,
  Array<"vendor" | "category" | "item">
> = {
  "vendor-directory": ["vendor", "category", "item"],
  global: ["vendor", "item", "category"],
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

function isAuctionLive(status: string, endTime: string) {
  return status === "live" && endTime > new Date().toISOString();
}

export function matchesAuctionSearchTerm(
  auction: Pick<AuctionSuggestionSource, "title" | "category">,
  query: string
): boolean {
  const q = normalizeSearchQuery(query);
  if (auction.title.toLowerCase().includes(q)) return true;
  return auctionCategoryMatchesQuery(auction.category, query);
}

export function buildVendorSuggestions(
  vendors: VendorDirectoryEntry[],
  query: string,
  auctions: AuctionSuggestionSource[],
  maxTotal = 6,
  groupOrder: SuggestionGroupOrder = "vendor-directory"
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

    if (haystack.includes(q) || vendorCategoriesMatchQuery(entry.categories, query)) {
      vendorHits.push({
        type: "vendor",
        id: `vendor-${vendor.wallet_address}`,
        shopSlug: entry.shopSlug,
        shopName,
        username: vendor.username,
        initials: vendorInitials(shopName),
        followersCount: vendor.followers_count,
        averageRating: entry.averageRating,
      });
    }
  }

  const matchedTaxonomyCategories = findMatchingCategories(query);
  const matchedTaxonomyLabels = new Set(
    matchedTaxonomyCategories.map((category) => category.label.toLowerCase())
  );

  const categoryCounts = new Map<string, number>();

  for (const category of matchedTaxonomyCategories) {
    const vendorCount = countVendorsForCategoryLabel(vendors, category.label);
    if (vendorCount > 0) {
      categoryCounts.set(category.label, vendorCount);
    }
  }

  for (const entry of vendors) {
    for (const category of entry.categories) {
      if (
        categoryCounts.has(category) ||
        matchedTaxonomyLabels.has(category.toLowerCase())
      ) {
        continue;
      }

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
    if (!matchesAuctionSearchTerm(auction, query)) continue;

    const entry = vendorByWallet.get(auction.seller_wallet);
    if (!entry) continue;

    itemHits.push({
      type: "item",
      id: `item-${auction.id}`,
      auctionId: auction.id,
      title: auction.title,
      vendorName: vendorDisplayName(entry),
      shopSlug: entry.shopSlug,
      currentBid: auction.current_bid,
      bidCount: auction.bid_count,
      isLive: isAuctionLive(auction.status, auction.end_time),
    });
  }

  const hitsByType = {
    vendor: vendorHits,
    category: categoryHits,
    item: itemHits,
  };

  const labelByType = {
    vendor: "Vendors",
    category: "Categories",
    item: "Items",
  };

  const groups: VendorSuggestionGroup[] = [];
  let remaining = maxTotal;

  for (const type of GROUP_ORDER[groupOrder]) {
    const hits = hitsByType[type];
    if (!hits.length || remaining <= 0) continue;

    const items = hits.slice(0, remaining);
    groups.push({ label: labelByType[type], items });
    remaining -= items.length;
  }

  return groups;
}

export function flattenSuggestions(groups: VendorSuggestionGroup[]) {
  return groups.flatMap((group) => group.items);
}
