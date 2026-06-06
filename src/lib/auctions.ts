import { supabase } from "@/lib/supabase";
import type { Auction } from "@/lib/database.types";

export interface LiveAuctionView {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

function parseAuction(row: {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  seller_wallet: string;
  current_bid: number | string;
  start_price: number | string;
  end_time: string;
  status: Auction["status"];
  category: string | null;
  created_at: string;
}): Auction {
  return {
    ...row,
    current_bid: Number(row.current_bid),
    start_price: Number(row.start_price),
  };
}

export async function getAllLiveAuctions(): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "live")
    .gt("end_time", new Date().toISOString())
    .order("end_time", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(parseAuction);
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
  return (data ?? []).map(parseAuction);
}

export async function getAuctionsPageData() {
  const [liveAuctions, upcomingAuctions] = await Promise.all([
    getAllLiveAuctions(),
    getUpcomingAuctions(),
  ]);

  const enrichedLive = await Promise.all(
    liveAuctions.map((auction) => enrichLiveAuction(auction))
  );

  const featured = enrichedLive[0] ?? null;
  const otherLive = enrichedLive.slice(1).map((item) => item.auction);

  return { featured, otherLive, upcomingAuctions };
}
