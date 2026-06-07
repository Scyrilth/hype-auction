import { getCategoryLabels } from "@/lib/categories";
import type { Auction, AuctionStatus } from "@/lib/database.types";
import { AUCTION_CONDITIONS } from "@/lib/grading";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export { AUCTION_CONDITIONS };

export const AUCTION_CATEGORIES = getCategoryLabels();

export const AUCTION_DURATIONS = [
  { label: "1 hour", hours: 1 },
  { label: "3 hours", hours: 3 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "72 hours", hours: 72 },
  { label: "7 days", hours: 168 },
] as const;

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
    status: row.status as AuctionStatus,
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

export async function getSellerAuctions(
  sellerWallet: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => parseAuction(row as Record<string, unknown>));
}

export async function createAuction({
  sellerWallet,
  title,
  description,
  category,
  condition,
  startPrice,
  durationHours,
  imageUrl,
  additionalImages = [],
  itemDetails = {},
}: {
  sellerWallet: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  startPrice: number;
  durationHours: number;
  imageUrl?: string;
  additionalImages?: string[];
  itemDetails?: Record<string, string>;
}) {
  await upsertUser(sellerWallet);

  const endTime = new Date(
    Date.now() + durationHours * 60 * 60 * 1000
  ).toISOString();

  const cleanedDetails = Object.fromEntries(
    Object.entries(itemDetails).filter(
      ([key, value]) => key.trim() && value.trim()
    )
  );

  const cleanedImages = additionalImages
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 4);

  const insertPayload: Record<string, unknown> = {
    title: title.trim(),
    description: description.trim() || null,
    category,
    condition,
    start_price: startPrice,
    current_bid: 0,
    image_url: imageUrl?.trim() || null,
    seller_wallet: sellerWallet,
    end_time: endTime,
    status: "live",
    additional_images: cleanedImages,
    item_details: cleanedDetails,
  };

  const { data, error } = await supabase
    .from("auctions")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return parseAuction(data as Record<string, unknown>);
}
