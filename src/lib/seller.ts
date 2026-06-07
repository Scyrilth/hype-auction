import { getCategoryLabels } from "@/lib/categories";
import type { Auction, AuctionStatus } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export const AUCTION_CATEGORIES = getCategoryLabels();

export const AUCTION_DURATIONS = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
] as const;

function parseAuction(row: {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  seller_wallet: string;
  current_bid: number | string;
  start_price: number | string;
  end_time: string;
  status: AuctionStatus;
  category: string | null;
  created_at: string;
}): Auction {
  return {
    ...row,
    current_bid: Number(row.current_bid),
    start_price: Number(row.start_price),
  };
}

export async function getSellerAuctions(
  sellerWallet: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseAuction);
}

export async function createAuction({
  sellerWallet,
  title,
  description,
  category,
  startPrice,
  durationHours,
  imageUrl,
}: {
  sellerWallet: string;
  title: string;
  description: string;
  category: string;
  startPrice: number;
  durationHours: number;
  imageUrl?: string;
}) {
  await upsertUser(sellerWallet);

  const endTime = new Date(
    Date.now() + durationHours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("auctions")
    .insert({
      title: title.trim(),
      description: description.trim() || null,
      category,
      start_price: startPrice,
      current_bid: 0,
      image_url: imageUrl?.trim() || null,
      seller_wallet: sellerWallet,
      end_time: endTime,
      status: "live",
    })
    .select()
    .single();

  if (error) throw error;
  return parseAuction(data);
}
