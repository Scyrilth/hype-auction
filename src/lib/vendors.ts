import type {
  Auction,
  ReviewWithReviewer,
  User,
  VendorShopStats,
} from "@/lib/database.types";
import { averageRatingFromReviews, getVendorReviews } from "@/lib/reviews";

export { getVendorReviews };
import {
  getBidCountsForAuctions,
  getBidCountsInLast24Hours,
} from "@/lib/auctions";
import { parseAuctionRow } from "@/lib/parse-auction";
import { getTopFeaturedAuctionIds, type AuctionLabelMaps } from "@/lib/auction-labels";
import { normalizeSocialHandle } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export function parseUser(row: Record<string, unknown>): User {
  return {
    wallet_address: row.wallet_address as string,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    reputation: Number(row.reputation ?? 0),
    created_at: row.created_at as string,
    shop_name: (row.shop_name as string | null) ?? null,
    banner_image: (row.banner_image as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    shop_description: (row.shop_description as string | null) ?? null,
    social_twitter: (row.social_twitter as string | null) ?? null,
    social_instagram: (row.social_instagram as string | null) ?? null,
    is_vendor: Boolean(row.is_vendor),
    is_verified: Boolean(row.is_verified),
    followers_count: Number(row.followers_count ?? 0),
    total_sales: Number(row.total_sales ?? 0),
    total_volume: Number(row.total_volume ?? 0),
    average_rating: Number(row.average_rating ?? 0),
    show_copy_wallet: row.show_copy_wallet !== false,
    show_won_auctions: Boolean(row.show_won_auctions),
    country: (row.country as string | null) ?? null,
    ships_internationally: Boolean(row.ships_internationally),
  };
}

function isWalletSlug(slug: string): boolean {
  return slug.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(slug);
}

export async function getVendorBySlug(slug: string): Promise<User | null> {
  if (isWalletSlug(slug)) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", slug)
      .maybeSingle();

    if (error) throw error;
    return data ? parseUser(data) : null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? parseUser(data) : null;
}

export async function getVendorLiveAuctions(
  sellerWallet: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .eq("status", "live")
    .order("end_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(parseAuctionRow);
}

export async function getVendorPastAuctions(
  sellerWallet: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .eq("status", "ended")
    .order("end_time", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseAuctionRow);
}

export function buildVendorStats(
  vendor: User,
  pastAuctions: Auction[],
  reviews: ReviewWithReviewer[]
): VendorShopStats {
  const totalVolume = pastAuctions.reduce((sum, a) => sum + a.current_bid, 0);
  const activeReviews = reviews.filter((review) => !review.is_flagged);
  const averageRating =
    activeReviews.length > 0
      ? averageRatingFromReviews(activeReviews)
      : vendor.average_rating;

  return {
    total_sales: pastAuctions.length,
    total_volume: totalVolume,
    followers_count: vendor.followers_count,
    average_rating: Math.round(averageRating * 10) / 10,
    review_count: activeReviews.length,
  };
}

export interface VendorShopData {
  vendor: User;
  liveAuctions: Auction[];
  pastAuctions: Auction[];
  reviews: ReviewWithReviewer[];
  stats: VendorShopStats;
  labelMaps: AuctionLabelMaps;
}

export async function getVendorShopData(slug: string): Promise<VendorShopData | null> {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return null;

  const vendorWallet = vendor.wallet_address;

  const [liveAuctions, pastAuctions, reviews] = await Promise.all([
    getVendorLiveAuctions(vendorWallet),
    getVendorPastAuctions(vendorWallet),
    getVendorReviews(vendorWallet),
  ]);

  console.log("[getVendorShopData] reviews loaded", {
    slug,
    vendorWallet,
    reviewCount: reviews.length,
  });

  const allAuctionIds = [...liveAuctions, ...pastAuctions].map(
    (auction) => auction.id
  );
  const [bidCounts, bidCounts24h] = await Promise.all([
    getBidCountsForAuctions(allAuctionIds),
    getBidCountsInLast24Hours(liveAuctions.map((auction) => auction.id)),
  ]);

  const labelMaps: AuctionLabelMaps = {
    bidCounts,
    bidCounts24h,
    topFeaturedIds: getTopFeaturedAuctionIds(
      liveAuctions.map((auction) => ({
        id: auction.id,
        bidCount24h: bidCounts24h.get(auction.id) ?? 0,
      }))
    ),
  };

  return {
    vendor,
    liveAuctions,
    pastAuctions,
    reviews,
    stats: buildVendorStats(vendor, pastAuctions, reviews),
    labelMaps,
  };
}

export interface VendorSettingsInput {
  shopName?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  bio?: string;
  shopDescription?: string;
  twitterHandle?: string;
  instagramHandle?: string;
  isVendor?: boolean;
  username?: string;
  showCopyWallet?: boolean;
  country?: string;
  shipsInternationally?: boolean;
}

export async function updateVendorSettings(
  walletAddress: string,
  settings: VendorSettingsInput
) {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        wallet_address: walletAddress,
        shop_name: settings.shopName?.trim() || null,
        banner_image: settings.bannerUrl?.trim() || null,
        avatar_url: settings.avatarUrl?.trim() || null,
        bio: settings.bio?.trim() || null,
        shop_description: settings.shopDescription?.trim() || null,
        social_twitter: normalizeSocialHandle(settings.twitterHandle ?? ""),
        social_instagram: normalizeSocialHandle(settings.instagramHandle ?? ""),
        is_vendor: settings.isVendor ?? true,
        username: settings.username?.trim() || null,
        show_copy_wallet: settings.showCopyWallet ?? true,
        country: settings.country?.trim() || null,
        ships_internationally: settings.shipsInternationally ?? false,
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .single();

  if (error) throw error;
  return parseUser(data);
}

const USER_BASE_COLUMNS =
  "wallet_address, username, avatar_url, reputation, created_at";

const USER_IDENTITY_COLUMNS = `${USER_BASE_COLUMNS}, shop_name`;

const USER_VENDOR_COLUMNS =
  "banner_image, bio, shop_description, social_twitter, social_instagram, is_vendor, is_verified, followers_count, total_sales, average_rating";

const USER_PROFILE_COLUMNS = `${USER_IDENTITY_COLUMNS}, ${USER_VENDOR_COLUMNS}`;

async function fetchUserProfile(
  walletAddress: string
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  const wallet = walletAddress.trim();

  const full = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", wallet)
    .maybeSingle();

  console.log("[fetchUserProfile] select(*) response", full);

  if (!full.error) {
    return { data: full.data as Record<string, unknown> | null, error: null };
  }

  console.warn(
    "[fetchUserProfile] select(*) failed, trying named columns",
    full.error
  );

  const extended = await supabase
    .from("users")
    .select(USER_PROFILE_COLUMNS)
    .eq("wallet_address", wallet)
    .maybeSingle();

  console.log("[fetchUserProfile] extended columns response", extended);

  if (!extended.error) {
    return { data: extended.data as Record<string, unknown> | null, error: null };
  }

  console.warn(
    "[fetchUserProfile] extended columns failed, falling back to identity columns",
    extended.error
  );

  const identity = await supabase
    .from("users")
    .select(USER_IDENTITY_COLUMNS)
    .eq("wallet_address", wallet)
    .maybeSingle();

  console.log("[fetchUserProfile] identity columns response", identity);

  if (!identity.error) {
    return { data: identity.data as Record<string, unknown> | null, error: null };
  }

  const base = await supabase
    .from("users")
    .select(USER_BASE_COLUMNS)
    .eq("wallet_address", wallet)
    .maybeSingle();

  console.log("[fetchUserProfile] base columns response", base);

  return {
    data: base.data as Record<string, unknown> | null,
    error: base.error,
  };
}

export async function getVendorSettings(
  walletAddress: string
): Promise<User | null> {
  const { data, error } = await fetchUserProfile(walletAddress);

  if (error) throw error;
  return data ? parseUser(data) : null;
}

export interface VendorDirectoryEntry {
  vendor: User;
  averageRating: number;
  totalSales: number;
  categories: string[];
  auctionTitles: string[];
  isLive: boolean;
  shopSlug: string;
}

function getShopSlug(vendor: User): string {
  return vendor.username ?? vendor.wallet_address;
}

export async function getVendorDirectory(): Promise<VendorDirectoryEntry[]> {
  const { data: vendors, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_vendor", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!vendors?.length) return [];

  const wallets = vendors.map((v) => v.wallet_address as string);
  const now = new Date().toISOString();

  const [{ data: reviews, error: reviewsError }, { data: auctions, error: auctionsError }] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("vendor_wallet, rating, is_flagged")
        .in("vendor_wallet", wallets)
        .eq("is_flagged", false),
      supabase
        .from("auctions")
        .select("seller_wallet, category, status, end_time, title")
        .in("seller_wallet", wallets),
    ]);

  if (reviewsError) throw reviewsError;
  if (auctionsError) throw auctionsError;

  const ratingsByVendor = new Map<string, number[]>();
  for (const review of reviews ?? []) {
    const wallet = review.vendor_wallet as string;
    const list = ratingsByVendor.get(wallet) ?? [];
    list.push(Number(review.rating));
    ratingsByVendor.set(wallet, list);
  }

  const salesByVendor = new Map<string, number>();
  const categoriesByVendor = new Map<string, Set<string>>();
  const titlesByVendor = new Map<string, Set<string>>();
  const liveVendors = new Set<string>();

  for (const auction of auctions ?? []) {
    const wallet = auction.seller_wallet as string;
    const category = auction.category as string | null;
    const title = auction.title as string | null;
    const status = auction.status as string;
    const endTime = auction.end_time as string;

    if (status === "ended") {
      salesByVendor.set(wallet, (salesByVendor.get(wallet) ?? 0) + 1);
    }

    if (status === "live" && endTime > now) {
      liveVendors.add(wallet);
    }

    if (category) {
      const set = categoriesByVendor.get(wallet) ?? new Set<string>();
      set.add(category);
      categoriesByVendor.set(wallet, set);
    }

    if (title) {
      const set = titlesByVendor.get(wallet) ?? new Set<string>();
      set.add(title);
      titlesByVendor.set(wallet, set);
    }
  }

  return vendors.map((row) => {
    const vendor = parseUser(row);
    const wallet = vendor.wallet_address;
    const ratings = ratingsByVendor.get(wallet) ?? [];
    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10
          ) / 10
        : Math.max(vendor.average_rating, vendor.reputation, 0);

    return {
      vendor,
      averageRating,
      totalSales: salesByVendor.get(wallet) ?? 0,
      categories: [...(categoriesByVendor.get(wallet) ?? [])],
      auctionTitles: [...(titlesByVendor.get(wallet) ?? [])],
      isLive: liveVendors.has(wallet),
      shopSlug: getShopSlug(vendor),
    };
  });
}
