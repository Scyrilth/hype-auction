import type { Auction } from "@/lib/database.types";
import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export async function getWatchlistAuctionIds(
  walletAddress: string,
  client: SupabaseClient = supabase
): Promise<string[]> {
  const { data, error } = await client
    .from("watchlist")
    .select("auction_id")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.auction_id as string);
}

export async function getWatchlistAuctions(
  walletAddress: string,
  client: SupabaseClient = supabase
): Promise<Auction[]> {
  const { data, error } = await client
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
  auctionId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client.from("watchlist").insert({
    wallet_address: walletAddress,
    auction_id: auctionId,
  });

  if (error) throw error;
}

export async function removeFromWatchlist(
  walletAddress: string,
  auctionId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("watchlist")
    .delete()
    .eq("wallet_address", walletAddress)
    .eq("auction_id", auctionId);

  if (error) throw error;
}
