import type { SupabaseClient } from "@supabase/supabase-js";

import { getTopFeaturedAuctionIds } from "@/lib/auction-labels";
import { parseAuctionRow } from "@/lib/parse-auction";
import { getVendorReviewCount } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { parseUser } from "@/lib/vendors";
import type { Auction, Bid, User } from "@/lib/database.types";

/**
 * Dummy listings: run `supabase/dummy-listings-refresh.sql` periodically during
 * development to keep `is_dummy = true` auctions live (extends end_time by 7 days).
 *
 * UPDATE public.auctions
 * SET end_time = NOW() + INTERVAL '7 days', status = 'live'
 * WHERE is_dummy = true AND escrow_tx_signature NOT LIKE 'admin_dummy_%';
 */

export interface LiveAuctionView {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

export interface BidWithBidder extends Bid {
  bidder_username: string | null;
}

export interface AuctionDetailData {
  auction: Auction;
  seller: User;
  bids: BidWithBidder[];
  bidCount: number;
  topBidder: string | null;
  topBidderUsername: string | null;
  sellerReviewCount: number;
}

export async function getBidCountsInLast24Hours(
  auctionIds: string[],
  client: SupabaseClient = supabase
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("bids")
    .select("auction_id")
    .in("auction_id", auctionIds)
    .gte("created_at", since);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const auctionId = row.auction_id as string;
    counts.set(auctionId, (counts.get(auctionId) ?? 0) + 1);
  }
  return counts;
}

export interface AuctionWithBidCount24h {
  auction: Auction;
  bidCount24h: number;
}

export async function getTrendingAuctions(
  limit = 10,
  client: SupabaseClient = supabase
): Promise<AuctionWithBidCount24h[]> {
  const liveAuctions = await getAllLiveAuctions(client);
  const bidCounts = await getBidCountsInLast24Hours(
    liveAuctions.map((auction) => auction.id),
    client
  );

  return liveAuctions
    .map((auction) => ({
      auction,
      bidCount24h: bidCounts.get(auction.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.bidCount24h - a.bidCount24h ||
        b.auction.current_bid - a.auction.current_bid
    )
    .slice(0, limit);
}

/** Fetches every active live auction (no row cap). PostgREST max is ~1000 rows. */
export async function getAllLiveAuctions(
  client: SupabaseClient = supabase
): Promise<Auction[]> {
  const { data, error } = await client
    .from("auctions")
    .select("*")
    .eq("status", "live")
    .gt("end_time", new Date().toISOString())
    .order("end_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => parseAuctionRow(row as Record<string, unknown>));
}

export async function getAuctionById(
  id: string,
  client: SupabaseClient = supabase
): Promise<Auction | null> {
  const { data, error } = await client
    .from("auctions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? parseAuctionRow(data as Record<string, unknown>) : null;
}

function parseBid(row: Record<string, unknown>): Bid {
  return {
    id: row.id as string,
    auction_id: row.auction_id as string,
    bidder_wallet: row.bidder_wallet as string,
    amount: Number(row.amount),
    created_at: row.created_at as string,
  };
}

export async function getBidCountsForAuctions(
  auctionIds: string[],
  client: SupabaseClient = supabase
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await client
    .from("bids")
    .select("auction_id")
    .in("auction_id", auctionIds);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const auctionId = row.auction_id as string;
    counts.set(auctionId, (counts.get(auctionId) ?? 0) + 1);
  }
  return counts;
}

export async function getAuctionDetailData(
  id: string,
  client: SupabaseClient = supabase
): Promise<AuctionDetailData | null> {
  const auction = await getAuctionById(id, client);
  if (!auction || !auction.id) return null;

    const [sellerResponse, bidsResponse, sellerReviewCount] = await Promise.all([
      client
        .from("users")
        .select("*")
        .eq("wallet_address", auction.seller_wallet)
        .maybeSingle(),
      client
        .from("bids")
        .select("*")
        .eq("auction_id", id)
        .order("amount", { ascending: false }),
      getVendorReviewCount(auction.seller_wallet).catch(() => 0),
    ]);

    if (sellerResponse.error) {
      console.error("getAuctionDetailData:seller", sellerResponse.error);
    }
    if (bidsResponse.error) {
      console.error("getAuctionDetailData:bids", bidsResponse.error);
    }

    const sellerPlaceholder = {
      wallet_address: auction.seller_wallet,
      username: null,
      avatar_url: null,
      reputation: 0,
      created_at: new Date(0).toISOString(),
      shop_name: "Unknown Seller",
      banner_image: null,
      bio: null,
      shop_description: null,
      social_twitter: null,
      social_instagram: null,
      is_vendor: false,
      is_verified: false,
      followers_count: 0,
      total_sales: 0,
      total_volume: 0,
      average_rating: 0,
      show_copy_wallet: true,
      show_won_auctions: false,
      country: null,
      ships_internationally: false,
      age_confirmed_at: null,
      tos_accepted_at: null,
      tos_version: null,
    } satisfies User;

    let seller: User = sellerPlaceholder;
    if (sellerResponse.data) {
      try {
        seller = parseUser(sellerResponse.data as Record<string, unknown>);
      } catch (error) {
        console.error("getAuctionDetailData:parseUser", error);
      }
    }

    const bidderWallets = [
      ...new Set(
        (bidsResponse.data ?? []).map((row) => row.bidder_wallet as string)
      ),
    ];

    let usernameByWallet = new Map<string, string | null>();
    if (bidderWallets.length) {
      const { data: bidders, error: biddersError } = await client
        .from("users")
        .select("wallet_address, username")
        .in("wallet_address", bidderWallets);

      if (biddersError) {
        console.error("getAuctionDetailData:bidders", biddersError);
      } else {
        usernameByWallet = new Map(
          (bidders ?? []).map((row) => [
            row.wallet_address as string,
            (row.username as string | null) ?? null,
          ])
        );
      }
    }

    const bids: BidWithBidder[] = (bidsResponse.data ?? [])
      .map((row) => {
        try {
          const bid = parseBid(row as Record<string, unknown>);
          return {
            ...bid,
            bidder_username: usernameByWallet.get(bid.bidder_wallet) ?? null,
          };
        } catch {
          return null;
        }
      })
      .filter((bid): bid is BidWithBidder => bid !== null);

    const topBid = bids[0] ?? null;

  return {
    auction,
    seller,
    bids,
    bidCount: bids.length,
    topBidder: topBid?.bidder_wallet ?? null,
    topBidderUsername: topBid?.bidder_username ?? null,
    sellerReviewCount,
  };
}

async function getAuctionBidStats(
  auctionId: string,
  client: SupabaseClient = supabase
) {
  const { count, error: countError } = await client
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("auction_id", auctionId);

  if (countError) throw countError;

  const { data: topBids, error: topBidError } = await client
    .from("bids")
    .select("*")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1);

  if (topBidError) throw topBidError;

  const topBidder = (topBids?.[0] as { bidder_wallet: string } | undefined)
    ?.bidder_wallet ?? null;

  return { bidCount: count ?? 0, topBidder };
}

export async function enrichLiveAuction(
  auction: Auction,
  client: SupabaseClient = supabase
): Promise<LiveAuctionView> {
  const stats = await getAuctionBidStats(auction.id, client);
  return { auction, ...stats };
}

export async function getUpcomingAuctions(
  client: SupabaseClient = supabase
): Promise<Auction[]> {
  const { data, error } = await client
    .from("auctions")
    .select("*")
    .eq("status", "draft")
    .order("end_time", { ascending: true })
    .limit(8);

  if (error) throw error;
  return (data ?? []).map((row) => parseAuctionRow(row as Record<string, unknown>));
}

export async function getAuctionsPageData(
  client: SupabaseClient = supabase
) {
  const [liveAuctions, upcomingAuctions] = await Promise.all([
    getAllLiveAuctions(client),
    getUpcomingAuctions(client),
  ]);

  const [enrichedLive, bidCounts24h] = await Promise.all([
    Promise.all(liveAuctions.map((auction) => enrichLiveAuction(auction, client))),
    getBidCountsInLast24Hours(liveAuctions.map((auction) => auction.id), client),
  ]);

  // Keep ending-soonest first (matches LiveAuctionsGrid "Ending Soon" default).
  const sortedLive = [...enrichedLive].sort(
    (a, b) =>
      new Date(a.auction.end_time).getTime() -
      new Date(b.auction.end_time).getTime()
  );

  const topFeaturedIds = getTopFeaturedAuctionIds(
    liveAuctions.map((auction) => ({
      id: auction.id,
      bidCount24h: bidCounts24h.get(auction.id) ?? 0,
    }))
  );

  const bidCounts = new Map(
    sortedLive.map((item) => [item.auction.id, item.bidCount])
  );

  const featured = sortedLive[0] ?? null;
  const otherLive = sortedLive.slice(1).map((item) => item.auction);

  return {
    featured,
    otherLive,
    upcomingAuctions,
    bidCounts24h,
    bidCounts,
    topFeaturedIds,
  };
}
