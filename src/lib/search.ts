import type { Auction } from "@/lib/database.types";
import {
  auctionCategoryMatchesQuery,
  findMatchingCategories,
  resolveCategoryLabels,
  vendorCategoriesMatchQuery,
} from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import {
  getVendorDirectory,
  type VendorDirectoryEntry,
} from "@/lib/vendors";

export function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

export function matchesVendorEntry(
  entry: VendorDirectoryEntry,
  query: string
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;

  const { vendor, categories, auctionTitles } = entry;
  const fields = [
    vendor.shop_name,
    vendor.username,
    vendor.bio,
    vendor.shop_description,
    vendor.wallet_address,
  ];

  if (fields.some((field) => field?.toLowerCase().includes(q))) {
    return true;
  }

  if (vendorCategoriesMatchQuery(categories, query)) {
    return true;
  }

  if (auctionTitles.some((title) => title.toLowerCase().includes(q))) {
    return true;
  }

  return false;
}

/** Wallets of sellers with auctions matching the query (title or category). */
export async function getSellerWalletsWithMatchingAuctionTitles(
  query: string
): Promise<Set<string>> {
  const q = normalizeSearchQuery(query);
  if (!q) return new Set();

  const resolvedLabels = resolveCategoryLabels(query);
  const wallets = new Set<string>();

  const requests = [
    supabase.from("auctions").select("seller_wallet, title").ilike("title", `%${q}%`),
    supabase.from("auctions").select("seller_wallet, category").ilike("category", `%${q}%`),
  ];

  if (resolvedLabels.length) {
    requests.push(
      supabase
        .from("auctions")
        .select("seller_wallet, category")
        .in("category", resolvedLabels)
    );
  }

  const results = await Promise.all(requests);

  for (const { data, error } of results) {
    if (error) throw error;
    for (const row of data ?? []) {
      const wallet = row.seller_wallet as string;
      if (wallet) wallets.add(wallet);
    }
  }

  return wallets;
}

export function filterVendorEntries(
  entries: VendorDirectoryEntry[],
  query: string,
  walletsFromAuctionTitles: Set<string> = new Set()
): VendorDirectoryEntry[] {
  const q = normalizeSearchQuery(query);
  if (!q) return entries;

  return entries.filter(
    (entry) =>
      matchesVendorEntry(entry, q) ||
      walletsFromAuctionTitles.has(entry.vendor.wallet_address)
  );
}

export interface VendorSearchHit {
  shopSlug: string;
  shopName: string;
  username: string | null;
  isVerified: boolean;
  isLive: boolean;
  categories: string[];
}

export interface AuctionSearchHit {
  id: string;
  title: string;
  category: string | null;
  currentBid: number;
  status: "live" | "ended";
  shopSlug: string;
}

export interface CategorySearchHit {
  name: string;
  count: number;
}

export interface GlobalSearchResults {
  query: string;
  vendors: VendorSearchHit[];
  liveAuctions: AuctionSearchHit[];
  categories: CategorySearchHit[];
  pastAuctions: AuctionSearchHit[];
}

function parseAuction(row: Record<string, unknown>): Auction {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    seller_wallet: row.seller_wallet as string,
    current_bid: Number(row.current_bid),
    start_price: Number(row.start_price),
    end_time: row.end_time as string,
    status: row.status as Auction["status"],
    category: (row.category as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

function matchesAuction(auction: Auction, q: string) {
  return (
    auction.title.toLowerCase().includes(q) ||
    auction.description?.toLowerCase().includes(q) ||
    auctionCategoryMatchesQuery(auction.category, q)
  );
}

function toAuctionHit(
  auction: Auction,
  sellerSlugs: Map<string, string>
): AuctionSearchHit {
  return {
    id: auction.id,
    title: auction.title,
    category: auction.category,
    currentBid: auction.current_bid,
    status: auction.status === "live" ? "live" : "ended",
    shopSlug:
      sellerSlugs.get(auction.seller_wallet) ?? auction.seller_wallet,
  };
}

const emptyResults = (query: string): GlobalSearchResults => ({
  query,
  vendors: [],
  liveAuctions: [],
  categories: [],
  pastAuctions: [],
});

export async function performGlobalSearch(
  query: string
): Promise<GlobalSearchResults> {
  const q = normalizeSearchQuery(query);
  if (!q) return emptyResults("");

  const now = new Date().toISOString();

  const [vendorDirectory, titleMatchWallets, { data: liveRows }, { data: pastRows }] =
    await Promise.all([
      getVendorDirectory(),
      getSellerWalletsWithMatchingAuctionTitles(q),
      supabase
        .from("auctions")
        .select("*")
        .eq("status", "live")
        .gt("end_time", now)
        .order("end_time", { ascending: true }),
      supabase
        .from("auctions")
        .select("*")
        .eq("status", "ended")
        .order("end_time", { ascending: false })
        .limit(100),
    ]);

  if (liveRows === null) throw new Error("Failed to fetch live auctions");
  if (pastRows === null) throw new Error("Failed to fetch past auctions");

  const liveAuctions = liveRows.map(parseAuction);
  const pastAuctions = pastRows.map(parseAuction);
  const allAuctions = [...liveAuctions, ...pastAuctions];

  const sellerSlugs = new Map(
    vendorDirectory.map((entry) => [
      entry.vendor.wallet_address,
      entry.shopSlug,
    ])
  );

  const vendors = filterVendorEntries(vendorDirectory, q, titleMatchWallets).map(
    (entry) => ({
      shopSlug: entry.shopSlug,
      shopName:
        entry.vendor.shop_name ??
        entry.vendor.username ??
        entry.shopSlug,
      username: entry.vendor.username,
      isVerified: entry.vendor.is_verified,
      isLive: entry.isLive,
      categories: entry.categories,
    })
  );

  const matchedTaxonomyCategories = findMatchingCategories(q);
  const categoryCounts = new Map<string, number>();

  for (const category of matchedTaxonomyCategories) {
    const count = allAuctions.filter(
      (auction) =>
        auction.category?.toLowerCase() === category.label.toLowerCase()
    ).length;
    if (count > 0) {
      categoryCounts.set(category.label, count);
    }
  }

  for (const auction of allAuctions) {
    if (auction.category?.toLowerCase().includes(q)) {
      categoryCounts.set(
        auction.category,
        (categoryCounts.get(auction.category) ?? 0) + 1
      );
    }
  }

  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    query,
    vendors,
    liveAuctions: liveAuctions
      .filter((auction) => matchesAuction(auction, q))
      .map((auction) => toAuctionHit(auction, sellerSlugs)),
    categories,
    pastAuctions: pastAuctions
      .filter((auction) => matchesAuction(auction, q))
      .map((auction) => toAuctionHit(auction, sellerSlugs)),
  };
}

export function hasSearchResults(results: GlobalSearchResults) {
  return (
    results.vendors.length > 0 ||
    results.liveAuctions.length > 0 ||
    results.categories.length > 0 ||
    results.pastAuctions.length > 0
  );
}
