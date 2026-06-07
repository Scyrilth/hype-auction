import type { Auction } from "@/lib/database.types";
import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase } from "@/lib/supabase";

export async function getWatchlistAuctionIds(
  walletAddress: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("auction_id")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.auction_id as string);
}

export async function getWatchlistAuctions(
  walletAddress: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select("auction_id, created_at, auctions(*)")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const auction = row.auctions as unknown;
      if (!auction || typeof auction !== "object" || Array.isArray(auction)) {
        return null;
      }
      return auction as Record<string, unknown>;
    })
    .filter((row): row is Record<string, unknown> => row !== null)
    .map(parseAuctionRow);
}

export async function addToWatchlist(
  walletAddress: string,
  auctionId: string
): Promise<void> {
  const { error } = await supabase.from("watchlist").insert({
    wallet_address: walletAddress,
    auction_id: auctionId,
  });

  if (error) throw error;
}

export async function removeFromWatchlist(
  walletAddress: string,
  auctionId: string
): Promise<void> {
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("wallet_address", walletAddress)
    .eq("auction_id", auctionId);

  if (error) throw error;
}
