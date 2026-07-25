import { getCategoryLabels } from "@/lib/categories";
import type { Auction, ListingType } from "@/lib/database.types";
import { AUCTION_CONDITIONS } from "@/lib/grading";
import { logSupabaseError, getErrorMessage } from "@/lib/errors";
import { GTC_END_TIME } from "@/lib/listing-types";
import { parseAuctionRow } from "@/lib/parse-auction";
import { generateReferenceNumber } from "@/lib/reference-number";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

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

export async function getSellerAuctions(
  sellerWallet: string
): Promise<Auction[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", sellerWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) =>
    parseAuctionRow(row as Record<string, unknown>)
  );
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
  domesticShippingUsd = 0,
  internationalShippingUsd = 0,
  listingType = "auction",
  buyNowPrice,
  goodTillCancelled = false,
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
  domesticShippingUsd?: number;
  internationalShippingUsd?: number;
  listingType?: ListingType;
  buyNowPrice?: number | null;
  goodTillCancelled?: boolean;
}) {
  await upsertUser(sellerWallet);

  const isFixedPrice = listingType === "fixed_price";
  const isAuctionBuyNow = listingType === "auction_buy_now";
  const gtc = isFixedPrice && goodTillCancelled;

  const endTime = gtc
    ? GTC_END_TIME
    : new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  const resolvedBuyNowPrice =
    isFixedPrice || isAuctionBuyNow ? (buyNowPrice ?? null) : null;
  const resolvedStartPrice = isFixedPrice
    ? (resolvedBuyNowPrice ?? startPrice)
    : startPrice;

  const cleanedDetails = Object.fromEntries(
    Object.entries(itemDetails).filter(
      ([key, value]) => key.trim() && value.trim()
    )
  );

  const cleanedImages = additionalImages
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 4);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const insertPayload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      condition,
      start_price: resolvedStartPrice,
      current_bid: 0,
      image_url: imageUrl?.trim() || null,
      seller_wallet: sellerWallet,
      end_time: endTime,
      status: "live",
      additional_images: cleanedImages,
      item_details: cleanedDetails,
      reference_number: generateReferenceNumber(),
      shipping_status: "pending",
      domestic_shipping_usd: domesticShippingUsd,
      international_shipping_usd: internationalShippingUsd,
      listing_type: listingType,
      purchase_type: "auction",
      buy_now_price: resolvedBuyNowPrice,
      good_till_cancelled: gtc,
    };

    const { data, error } = await supabase
      .from("auctions")
      .insert(insertPayload)
      .select()
      .single();

    if (!error) {
      return parseAuctionRow(data as Record<string, unknown>);
    }

    if (error.code === "23505") {
      lastError = error;
      continue;
    }

    logSupabaseError("createAuction", error);
    throw new Error("Unable to create listing. Please try again.");
  }

  logSupabaseError("createAuction", lastError);
  throw new Error("Unable to create listing. Please try again.");
}

/** Client helper — creates a listing via the rate-limited API route. */
export async function createListingViaApi(
  params: Parameters<typeof createAuction>[0]
): Promise<Auction> {
  const response = await fetch("/api/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getWalletAuthHeaders(),
    },
    body: JSON.stringify({
      sellerWallet: params.sellerWallet,
      title: params.title,
      description: params.description,
      category: params.category,
      condition: params.condition,
      startPrice: params.startPrice,
      durationHours: params.durationHours,
      imageUrl: params.imageUrl,
      additionalImages: params.additionalImages,
      itemDetails: params.itemDetails,
      domesticShippingUsd: params.domesticShippingUsd,
      internationalShippingUsd: params.internationalShippingUsd,
      listingType: params.listingType,
      buyNowPrice: params.buyNowPrice,
      goodTillCancelled: params.goodTillCancelled,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    auction?: Auction;
  };

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload.error, "Unable to create listing. Please try again.")
    );
  }

  if (!payload.auction) {
    throw new Error("Unable to create listing. Please try again.");
  }

  return payload.auction;
}
