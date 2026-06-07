import { supabase } from "@/lib/supabase";
import type { Auction } from "@/lib/database.types";

export interface LiveAuctionView {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

function parseAuction(row: Record<string, unknown>): Auction {
  const itemDetails = row.item_details;
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
    condition: (row.condition as string | null) ?? null,
    additional_images: Array.isArray(row.additional_images)
      ? (row.additional_images as string[])
      : [],
    item_details:
      itemDetails && typeof itemDetails === "object" && !Array.isArray(itemDetails)
        ? (itemDetails as Record<string, string>)
        : {},
    created_at: row.created_at as string,
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
  return (data ?? []).map((row) => parseAuction(row as Record<string, unknown>));
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
  return (data ?? []).map((row) => parseAuction(row as Record<string, unknown>));
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
