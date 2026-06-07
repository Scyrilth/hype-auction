import type { Auction } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

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
    is_featured: Boolean(row.is_featured),
  };
}

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
    .map(parseAuction);
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
