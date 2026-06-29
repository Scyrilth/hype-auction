import type { AnchorProvider } from "@coral-xyz/anchor";

import { confirmShippingOnChain } from "@/lib/escrow";
import { parseAuctionRow } from "@/lib/parse-auction";
import type { Auction, ShippingStatus } from "@/lib/database.types";
import {
  createAuctionThread,
  insertThreadSystemMessage,
} from "@/lib/messages";
import {
  notifyItemShipped,
} from "@/lib/notifications";
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

async function notifyBuyerShipment({
  auctionId,
  auctionTitle,
  buyerWallet,
  sellerWallet,
  courier,
  trackingNumber,
}: {
  auctionId: string;
  auctionTitle: string;
  buyerWallet: string;
  sellerWallet: string;
  courier: string;
  trackingNumber: string;
}): Promise<void> {
  const content = `📦 Seller has shipped the item. Tracking: ${trackingNumber} via ${courier}`;

  const { data: thread, error } = await supabase
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("status", "active")
    .eq("buyer_wallet", buyerWallet)
    .maybeSingle();

  if (error) throw error;

  let threadId = thread?.id as string | undefined;
  if (!threadId) {
    const created = await createAuctionThread(
      auctionId,
      buyerWallet,
      sellerWallet,
      auctionTitle,
      { skipWelcomeMessage: true }
    );
    threadId = created.id;
  }

  await insertThreadSystemMessage(threadId, content, sellerWallet);

  await notifyItemShipped({
    buyerWallet,
    auctionTitle,
    courier,
    trackingNumber,
    threadId,
  });
}

export interface ShippingOnChainParams {
  provider: AnchorProvider;
}

export async function saveAuctionShippingTracking({
  auctionId,
  sellerWallet,
  courier,
  trackingNumber,
  onChain,
}: {
  auctionId: string;
  sellerWallet: string;
  courier: string;
  trackingNumber: string;
  onChain?: ShippingOnChainParams;
}): Promise<Auction> {
  const trimmedCourier = courier.trim();
  const trimmedTracking = trackingNumber.trim();

  if (!trimmedCourier) throw new Error("Select a courier.");
  if (!trimmedTracking) throw new Error("Enter a tracking number.");

  const { data: existing, error: fetchError } = await supabase
    .from("auctions")
    .select("id, seller_wallet, shipping_status, title")
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

  if (onChain) {
    const onChainResult = await confirmShippingOnChain(
      auctionId,
      onChain.provider.wallet,
      onChain.provider
    );
    if (!onChainResult.success) {
      console.error("On-chain confirm_shipping failed:", onChainResult.error);
    }
  }

  if (winnerBid?.bidder_wallet) {
    await notifyBuyerShipment({
      auctionId,
      auctionTitle: existing.title as string,
      buyerWallet: winnerBid.bidder_wallet as string,
      sellerWallet,
      courier: trimmedCourier,
      trackingNumber: trimmedTracking,
    });
  }

  return parseAuctionRow(data as Record<string, unknown>);
}
