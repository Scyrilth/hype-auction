import type {
  Auction,
  ReviewWithReviewer,
  User,
  VendorShopStats,
} from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

function parseUser(row: Record<string, unknown>): User {
  return {
    wallet_address: row.wallet_address as string,
    username: (row.username as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    reputation: Number(row.reputation ?? 0),
    created_at: row.created_at as string,
    shop_name: (row.shop_name as string | null) ?? null,
    banner_url: (row.banner_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    shop_description: (row.shop_description as string | null) ?? null,
    twitter_url: (row.twitter_url as string | null) ?? null,
    instagram_url: (row.instagram_url as string | null) ?? null,
    is_vendor: Boolean(row.is_vendor),
    is_verified: Boolean(row.is_verified),
    followers_count: Number(row.followers_count ?? 0),
    total_sales: Number(row.total_sales ?? 0),
    total_volume: Number(row.total_volume ?? 0),
    average_rating: Number(row.average_rating ?? 0),
  };
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
  return (data ?? []).map(parseAuction);
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
  return (data ?? []).map(parseAuction);
}

export async function getVendorReviews(
  vendorWallet: string
): Promise<ReviewWithReviewer[]> {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("vendor_wallet", vendorWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!reviews?.length) return [];

  const reviewerWallets = [
    ...new Set(reviews.map((r) => r.reviewer_wallet as string)),
  ];

  const { data: reviewers, error: reviewersError } = await supabase
    .from("users")
    .select("wallet_address, username, avatar_url")
    .in("wallet_address", reviewerWallets);

  if (reviewersError) throw reviewersError;

  const reviewerMap = new Map(
    (reviewers ?? []).map((u) => [u.wallet_address as string, u])
  );

  return reviews.map((row) => {
    const reviewer = reviewerMap.get(row.reviewer_wallet as string);

    return {
      id: row.id as string,
      vendor_wallet: row.vendor_wallet as string,
      reviewer_wallet: row.reviewer_wallet as string,
      auction_id: (row.auction_id as string | null) ?? null,
      rating: row.rating as number,
      comment: (row.comment as string | null) ?? null,
      created_at: row.created_at as string,
      reviewer_username: (reviewer?.username as string | null) ?? null,
      reviewer_avatar: (reviewer?.avatar_url as string | null) ?? null,
    };
  });
}

export function buildVendorStats(
  vendor: User,
  pastAuctions: Auction[],
  reviews: ReviewWithReviewer[]
): VendorShopStats {
  const totalVolume = pastAuctions.reduce((sum, a) => sum + a.current_bid, 0);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : vendor.average_rating;

  return {
    total_sales: pastAuctions.length,
    total_volume: totalVolume,
    followers_count: vendor.followers_count,
    average_rating: Math.round(averageRating * 10) / 10,
  };
}

export interface VendorShopData {
  vendor: User;
  liveAuctions: Auction[];
  pastAuctions: Auction[];
  reviews: ReviewWithReviewer[];
  stats: VendorShopStats;
}

export async function getVendorShopData(slug: string): Promise<VendorShopData | null> {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return null;

  const [liveAuctions, pastAuctions, reviews] = await Promise.all([
    getVendorLiveAuctions(vendor.wallet_address),
    getVendorPastAuctions(vendor.wallet_address),
    getVendorReviews(vendor.wallet_address),
  ]);

  return {
    vendor,
    liveAuctions,
    pastAuctions,
    reviews,
    stats: buildVendorStats(vendor, pastAuctions, reviews),
  };
}

export interface VendorSettingsInput {
  shopName?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  bio?: string;
  shopDescription?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  isVendor?: boolean;
  username?: string;
}

export async function updateVendorSettings(
  walletAddress: string,
  settings: VendorSettingsInput
) {
  const { data, error } = await supabase
    .from("users")
    .update({
      shop_name: settings.shopName?.trim() || null,
      banner_url: settings.bannerUrl?.trim() || null,
      avatar_url: settings.avatarUrl?.trim() || null,
      bio: settings.bio?.trim() || null,
      shop_description: settings.shopDescription?.trim() || null,
      twitter_url: settings.twitterUrl?.trim() || null,
      instagram_url: settings.instagramUrl?.trim() || null,
      is_vendor: settings.isVendor ?? true,
      username: settings.username?.trim() || null,
    })
    .eq("wallet_address", walletAddress)
    .select()
    .single();

  if (error) throw error;
  return parseUser(data);
}

export async function getVendorSettings(
  walletAddress: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) throw error;
  return data ? parseUser(data) : null;
}
