import { getTopFeaturedAuctionIds } from "@/lib/auction-labels";
import { parseAuctionRow } from "@/lib/parse-auction";
import { getVendorReviewCount } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";
import { parseUser } from "@/lib/vendors";
import type { Auction, Bid, User } from "@/lib/database.types";

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
  similarAuctions: Auction[];
  sellerReviewCount: number;
}

export async function getBidCountsInLast24Hours(
  auctionIds: string[]
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
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
  limit = 10
): Promise<AuctionWithBidCount24h[]> {
  const liveAuctions = await getAllLiveAuctions();
  const bidCounts = await getBidCountsInLast24Hours(
    liveAuctions.map((auction) => auction.id)
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

export async function getAllLiveAuctions(): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "live")
    .gt("end_time", new Date().toISOString())
    .order("end_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => parseAuctionRow(row as Record<string, unknown>));
}

export async function getAuctionById(id: string): Promise<Auction | null> {
  const { data, error } = await supabase
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
  auctionIds: string[]
): Promise<Map<string, number>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await supabase
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

async function getSimilarAuctions(
  auction: Auction,
  limit = 4
): Promise<Auction[]> {
  const picked = new Map<string, Auction>();

  if (auction.category) {
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .eq("category", auction.category)
      .neq("id", auction.id)
      .in("status", ["live", "ended"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    for (const row of data ?? []) {
      const parsed = parseAuctionRow(row as Record<string, unknown>);
      picked.set(parsed.id, parsed);
    }
  }

  if (picked.size < limit) {
    const excludeIds = new Set([auction.id, ...picked.keys()]);
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .in("status", ["live", "ended"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const candidates = (data ?? [])
      .map((row) => parseAuctionRow(row as Record<string, unknown>))
      .filter((item) => !excludeIds.has(item.id));
    const bidCounts = await getBidCountsForAuctions(
      candidates.map((item) => item.id)
    );

    candidates.sort(
      (a, b) =>
        (bidCounts.get(b.id) ?? 0) - (bidCounts.get(a.id) ?? 0) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const candidate of candidates) {
      if (picked.size >= limit) break;
      picked.set(candidate.id, candidate);
    }
  }

  return [...picked.values()].slice(0, limit);
}

export async function getAuctionDetailData(
  id: string
): Promise<AuctionDetailData | null> {
  const auction = await getAuctionById(id);
  if (!auction) return null;

  const [sellerResponse, bidsResponse, similarAuctions, sellerReviewCount] =
    await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("wallet_address", auction.seller_wallet)
        .maybeSingle(),
      supabase
        .from("bids")
        .select("*")
        .eq("auction_id", id)
        .order("amount", { ascending: false }),
      getSimilarAuctions(auction),
      getVendorReviewCount(auction.seller_wallet),
    ]);

  if (sellerResponse.error) throw sellerResponse.error;
  if (bidsResponse.error) throw bidsResponse.error;

  const seller = sellerResponse.data
    ? parseUser(sellerResponse.data as Record<string, unknown>)
    : ({
        wallet_address: auction.seller_wallet,
        username: null,
        avatar_url: null,
        reputation: 0,
        created_at: new Date(0).toISOString(),
        shop_name: null,
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
      } satisfies User);

  const bidderWallets = [
    ...new Set(
      (bidsResponse.data ?? []).map((row) => row.bidder_wallet as string)
    ),
  ];

  let usernameByWallet = new Map<string, string | null>();
  if (bidderWallets.length) {
    const { data: bidders, error: biddersError } = await supabase
      .from("users")
      .select("wallet_address, username")
      .in("wallet_address", bidderWallets);

    if (biddersError) throw biddersError;

    usernameByWallet = new Map(
      (bidders ?? []).map((row) => [
        row.wallet_address as string,
        (row.username as string | null) ?? null,
      ])
    );
  }

  const bids: BidWithBidder[] = (bidsResponse.data ?? []).map((row) => {
    const bid = parseBid(row as Record<string, unknown>);
    return {
      ...bid,
      bidder_username: usernameByWallet.get(bid.bidder_wallet) ?? null,
    };
  });

  const topBid = bids[0] ?? null;

  return {
    auction,
    seller,
    bids,
    bidCount: bids.length,
    topBidder: topBid?.bidder_wallet ?? null,
    topBidderUsername: topBid?.bidder_username ?? null,
    similarAuctions,
    sellerReviewCount,
  };
}

async function getAuctionBidStats(auctionId: string) {
  const { count, error: countError } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .eq("auction_id", auctionId);

  if (countError) throw countError;

  const { data: topBids, error: topBidError } = await supabase
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
  auction: Auction
): Promise<LiveAuctionView> {
  const stats = await getAuctionBidStats(auction.id);
  return { auction, ...stats };
}

export async function getUpcomingAuctions(): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "draft")
    .order("end_time", { ascending: true })
    .limit(8);

  if (error) throw error;
  return (data ?? []).map((row) => parseAuctionRow(row as Record<string, unknown>));
}

export async function getAuctionsPageData() {
  const [liveAuctions, upcomingAuctions] = await Promise.all([
    getAllLiveAuctions(),
    getUpcomingAuctions(),
  ]);

  const [enrichedLive, bidCounts24h] = await Promise.all([
    Promise.all(liveAuctions.map((auction) => enrichLiveAuction(auction))),
    getBidCountsInLast24Hours(liveAuctions.map((auction) => auction.id)),
  ]);

  const topFeaturedIds = getTopFeaturedAuctionIds(
    liveAuctions.map((auction) => ({
      id: auction.id,
      bidCount24h: bidCounts24h.get(auction.id) ?? 0,
    }))
  );

  const bidCounts = new Map(
    enrichedLive.map((item) => [item.auction.id, item.bidCount])
  );

  const featured = enrichedLive[0] ?? null;
  const otherLive = enrichedLive.slice(1).map((item) => item.auction);

  return {
    featured,
    otherLive,
    upcomingAuctions,
    bidCounts24h,
    bidCounts,
    topFeaturedIds,
  };
}
