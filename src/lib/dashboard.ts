import type {
  Auction,
  ReviewWithReviewer,
  User,
} from "@/lib/database.types";
import { parseAuctionRow } from "@/lib/parse-auction";
import {
  endAuctionEarlyAsSeller,
  type EarlyEndReason,
} from "@/lib/auction-early-end";
import { supabase, type SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";
import { getVendorReviews, getVendorSettings } from "@/lib/vendors";

export interface SellerAuctionWithStats extends Auction {
  bidCount: number;
  winnerWallet: string | null;
}

export interface SellerBidRow {
  id: string;
  auctionId: string;
  auctionTitle: string;
  bidderWallet: string;
  amount: number;
  createdAt: string;
}

export type DashboardActivityItem =
  | {
      type: "bid";
      id: string;
      createdAt: string;
      auctionTitle: string;
      bidderWallet: string;
      amount: number;
    }
  | {
      type: "follow";
      id: string;
      createdAt: string;
      followerWallet: string;
    }
  | {
      type: "review";
      id: string;
      createdAt: string;
      reviewerWallet: string;
      rating: number;
      comment: string | null;
    };

export interface SellerDashboardStats {
  totalListings: number;
  activeAuctions: number;
  totalBidsReceived: number;
  totalVolume: number;
  followers: number;
  averageRating: number;
}

export interface SellerDashboardData {
  profile: User | null;
  shopSlug: string;
  stats: SellerDashboardStats;
  activeAuctions: SellerAuctionWithStats[];
  pastAuctions: SellerAuctionWithStats[];
  bidsReceived: SellerBidRow[];
  reviews: ReviewWithReviewer[];
  activity: DashboardActivityItem[];
}

async function getBidCounts(
  auctionIds: string[],
  client: SupabaseClient
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await client
    .from("bids")
    .select("auction_id")
    .in("auction_id", auctionIds);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.auction_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function getWinnerWallets(
  auctionIds: string[],
  client: SupabaseClient
): Promise<Map<string, string | null>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await client
    .from("bids")
    .select("auction_id, bidder_wallet, amount")
    .in("auction_id", auctionIds)
    .order("amount", { ascending: false });

  if (error) throw error;

  const winners = new Map<string, string | null>();
  for (const row of data ?? []) {
    const auctionId = row.auction_id as string;
    if (!winners.has(auctionId)) {
      winners.set(auctionId, row.bidder_wallet as string);
    }
  }
  return winners;
}

function enrichAuctions(
  auctions: Auction[],
  bidCounts: Map<string, number>,
  winners: Map<string, string | null>
): SellerAuctionWithStats[] {
  return auctions.map((auction) => ({
    ...auction,
    bidCount: bidCounts.get(auction.id) ?? 0,
    winnerWallet: winners.get(auction.id) ?? null,
  }));
}

async function loadSellerReviews(wallet: string): Promise<ReviewWithReviewer[]> {
  try {
    return await getVendorReviews(wallet);
  } catch (error) {
    console.warn("[getSellerDashboardData] reviews query failed", error);
    return [];
  }
}

async function loadRecentFollows(wallet: string, client: SupabaseClient) {
  const response = await client
    .from("follows")
    .select("follower_wallet, created_at")
    .eq("following_wallet", wallet)
    .order("created_at", { ascending: false })
    .limit(20);

  if (response.error) {
    console.warn("[getSellerDashboardData] follows query failed", response.error);
    return [];
  }

  return response.data ?? [];
}

export async function getSellerDashboardData(
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<SellerDashboardData> {
  const wallet = sellerWallet.trim();

  let profile: User | null = null;
  try {
    const rawProfile = await client
      .from("users")
      .select("shop_name")
      .eq("wallet_address", wallet)
      .maybeSingle();

    profile = await getVendorSettings(wallet, client);

    if (
      profile &&
      !profile.shop_name?.trim() &&
      rawProfile.data &&
      typeof rawProfile.data.shop_name === "string" &&
      rawProfile.data.shop_name.trim()
    ) {
      profile = {
        ...profile,
        shop_name: rawProfile.data.shop_name.trim(),
      };
    }
  } catch (error) {
    console.error("[getSellerDashboardData] profile query failed", error);
    throw error;
  }

  if (!profile) {
    try {
      await upsertUser(wallet, client);
      profile = await getVendorSettings(wallet, client);
    } catch (error) {
      console.error("[getSellerDashboardData] profile upsert/fetch failed", error);
      throw error;
    }
  }

  const auctionsResponse = await client
    .from("auctions")
    .select("*")
    .eq("seller_wallet", wallet)
    .order("created_at", { ascending: false });

  const bidsResponse = await client
    .from("bids")
    .select("id, auction_id, bidder_wallet, amount, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const [followRows, reviews] = await Promise.all([
    loadRecentFollows(wallet, client),
    loadSellerReviews(wallet),
  ]);

  if (auctionsResponse.error) throw auctionsResponse.error;
  if (bidsResponse.error) throw bidsResponse.error;

  const auctions = (auctionsResponse.data ?? []).map((row) =>
    parseAuctionRow(row as Record<string, unknown>)
  );
  const auctionIds = new Set(auctions.map((a) => a.id));
  const auctionTitleById = new Map(auctions.map((a) => [a.id, a.title]));

  const [bidCounts, winners] = await Promise.all([
    getBidCounts([...auctionIds], client),
    getWinnerWallets([...auctionIds], client),
  ]);

  const enriched = enrichAuctions(auctions, bidCounts, winners);

  const activeAuctions = enriched.filter((a) => a.status === "live");
  const pastAuctions = enriched.filter(
    (a) =>
      a.status === "ended" ||
      a.status === "completed" ||
      a.status === "cancelled" ||
      a.status === "draft"
  );

  const bidsReceived: SellerBidRow[] = (bidsResponse.data ?? [])
    .filter((row) => auctionIds.has(row.auction_id as string))
    .map((row) => ({
      id: row.id as string,
      auctionId: row.auction_id as string,
      auctionTitle:
        auctionTitleById.get(row.auction_id as string) ?? "Auction",
      bidderWallet: row.bidder_wallet as string,
      amount: Number(row.amount),
      createdAt: row.created_at as string,
    }));

  const totalVolume = pastAuctions.reduce(
    (sum, a) => sum + (a.current_bid > 0 ? a.current_bid : 0),
    0
  );

  const stats: SellerDashboardStats = {
    totalListings: auctions.length,
    activeAuctions: activeAuctions.length,
    totalBidsReceived: bidsReceived.length,
    totalVolume,
    followers: profile?.followers_count ?? 0,
    averageRating: profile?.average_rating ?? 0,
  };

  const activity: DashboardActivityItem[] = [
    ...bidsReceived.slice(0, 15).map((bid) => ({
      type: "bid" as const,
      id: bid.id,
      createdAt: bid.createdAt,
      auctionTitle: bid.auctionTitle,
      bidderWallet: bid.bidderWallet,
      amount: bid.amount,
    })),
    ...followRows.map((row) => ({
      type: "follow" as const,
      id: `follow-${row.follower_wallet}-${row.created_at}`,
      createdAt: row.created_at as string,
      followerWallet: row.follower_wallet as string,
    })),
    ...reviews.slice(0, 10).map((review) => ({
      type: "review" as const,
      id: review.id,
      createdAt: review.created_at,
      reviewerWallet: review.reviewer_wallet,
      rating: review.rating,
      comment: review.comment,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const shopSlug = profile?.username?.trim() || wallet;

  const result = {
    profile,
    shopSlug,
    stats,
    activeAuctions,
    pastAuctions,
    bidsReceived,
    reviews,
    activity: activity.slice(0, 20),
  };

  return result;
}

export async function endSellerAuction(
  auctionId: string,
  sellerWallet: string,
  reason?: EarlyEndReason | null,
  client: SupabaseClient = supabase
): Promise<void> {
  await endAuctionEarlyAsSeller({
    auctionId,
    sellerWallet,
    reason,
    client,
  });
}
