import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase } from "@/lib/supabase";
import type { Auction } from "@/lib/database.types";
import { getBidCountsForAuctions } from "@/lib/auctions";

const LIVE_AUCTION_LIMIT = 4;

function liveAuctionFilters(now: string) {
  return {
    status: "live" as const,
    endAfter: now,
  };
}

export async function getMoreFromSellerAuctions(
  sellerWallet: string,
  excludeAuctionId: string,
  limit = LIVE_AUCTION_LIMIT
): Promise<Auction[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .eq("status", liveAuctionFilters(now).status)
    .gt("end_time", now)
    .neq("id", excludeAuctionId)
    .order("end_time", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => parseAuctionRow(row as Record<string, unknown>));
}

export async function getSimilarAuctionsForDetail(
  auction: Pick<Auction, "id" | "category" | "seller_wallet">,
  limit = LIVE_AUCTION_LIMIT
): Promise<Auction[]> {
  if (!auction.category?.trim()) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("category", auction.category)
    .eq("status", liveAuctionFilters(now).status)
    .gt("end_time", now)
    .neq("id", auction.id)
    .neq("seller_wallet", auction.seller_wallet)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) throw error;

  const candidates = (data ?? []).map((row) =>
    parseAuctionRow(row as Record<string, unknown>)
  );

  if (!candidates.length) return [];

  const bidCounts = await getBidCountsForAuctions(candidates.map((item) => item.id));

  candidates.sort(
    (a, b) =>
      (bidCounts.get(b.id) ?? 0) - (bidCounts.get(a.id) ?? 0) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return candidates.slice(0, limit);
}
