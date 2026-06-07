import { parseAuctionRow } from "@/lib/parse-auction";
import type { Auction, ShippingStatus } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export const SHIPPING_COURIERS = [
  "DHL",
  "FedEx",
  "UPS",
  "USPS",
  "Aramex",
  "Royal Mail",
  "Australia Post",
  "Singapore Post",
  "J&T Express",
  "Other",
] as const;

export type ShippingCourier = (typeof SHIPPING_COURIERS)[number];

async function insertShippingSystemMessage(
  auctionId: string,
  buyerWallet: string,
  sellerWallet: string,
  courier: string,
  trackingNumber: string
): Promise<void> {
  const { data: thread, error } = await supabase
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", buyerWallet)
    .eq("seller_wallet", sellerWallet)
    .maybeSingle();

  if (error) throw error;
  if (!thread) return;

  const content = `📦 Your item has been shipped via ${courier}. Tracking number: ${trackingNumber}`;
  const { error: messageError } = await supabase.from("direct_messages").insert({
    thread_id: thread.id as string,
    sender_wallet: sellerWallet,
    content,
    is_system: true,
    is_read: false,
  });

  if (messageError) throw messageError;
}

export async function saveAuctionShippingTracking({
  auctionId,
  sellerWallet,
  courier,
  trackingNumber,
}: {
  auctionId: string;
  sellerWallet: string;
  courier: string;
  trackingNumber: string;
}): Promise<Auction> {
  const trimmedCourier = courier.trim();
  const trimmedTracking = trackingNumber.trim();

  if (!trimmedCourier) throw new Error("Select a courier.");
  if (!trimmedTracking) throw new Error("Enter a tracking number.");

  const { data: existing, error: fetchError } = await supabase
    .from("auctions")
    .select("id, seller_wallet, shipping_status")
    .eq("id", auctionId)
    .eq("seller_wallet", sellerWallet)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Auction not found.");

  const { data: winnerBid, error: winnerError } = await supabase
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (winnerError) throw winnerError;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("auctions")
    .update({
      tracking_courier: trimmedCourier,
      tracking_number: trimmedTracking,
      tracking_uploaded_at: now,
      shipping_status: "shipped" satisfies ShippingStatus,
    })
    .eq("id", auctionId)
    .eq("seller_wallet", sellerWallet)
    .select("*")
    .single();

  if (error) throw error;

  if (winnerBid?.bidder_wallet) {
    await insertShippingSystemMessage(
      auctionId,
      winnerBid.bidder_wallet as string,
      sellerWallet,
      trimmedCourier,
      trimmedTracking
    );
  }

  return parseAuctionRow(data as Record<string, unknown>);
}
