import type { Auction, ShippingAddress } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import {
  createAuctionThread,
  insertThreadSystemMessage,
  type MessageThread,
} from "@/lib/messages";
import {
  notifyBuyNowBuyer,
  notifyBuyNowOutbidBidder,
  notifyBuyNowSeller,
  notifyPaymentConfirmed,
} from "@/lib/notifications";
import {
  canBuyNow,
  getBuyNowPrice,
  isGoodTillCancelled,
} from "@/lib/listing-types";
import { parseAuctionRow } from "@/lib/parse-auction";
import { isShippingExemptAuction, resolveShippingUsd } from "@/lib/auction-shipping";
import { getAuthenticatedClient, supabase, type SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";
import type { AuctionSummaryPayload } from "@/lib/auction-lifecycle";

export const BUY_NOW_RACE_ERROR =
  "Sorry, this item was just purchased by someone else. You were not charged.";

export class BuyNowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuyNowError";
  }
}

export async function verifyBuyNowAvailable(
  auctionId: string,
  buyerWallet: string,
  client: SupabaseClient = supabase
): Promise<Auction> {
  const { data, error } = await client
    .from("auctions")
    .select("*")
    .eq("id", auctionId.trim())
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new BuyNowError("Listing not found.");
  }

  const auction = parseAuctionRow(data as Record<string, unknown>);

  if (!canBuyNow(auction, buyerWallet)) {
    throw new BuyNowError(BUY_NOW_RACE_ERROR);
  }

  return auction;
}

async function ensureBuyNowThread(
  auction: Auction,
  buyerWallet: string,
  client: SupabaseClient
): Promise<MessageThread> {
  return createAuctionThread(
    auction.id,
    buyerWallet,
    auction.seller_wallet,
    auction.title,
    { skipWelcomeMessage: true },
    client
  );
}

export async function confirmBuyNowShippingAddress({
  auctionId,
  buyerWallet,
  addressId,
  client = supabase,
}: {
  auctionId: string;
  buyerWallet: string;
  addressId: string;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  shippingCountry: string;
  threadId: string;
  address: ShippingAddress;
}> {
  const auction = await verifyBuyNowAvailable(auctionId, buyerWallet, client);
  const db = client ?? getAuthenticatedClient(buyerWallet);

  if (!addressId?.trim()) {
    throw new BuyNowError("Select a shipping address.");
  }

  const { data: addressRow, error: addressError } = await db
    .from("shipping_addresses")
    .select("*")
    .eq("id", addressId.trim())
    .eq("wallet_address", buyerWallet.trim())
    .maybeSingle();

  if (addressError) throw addressError;
  if (!addressRow) {
    throw new BuyNowError("Shipping address not found.");
  }

  const address = addressRow as ShippingAddress;

  const { data: seller, error: sellerError } = await db
    .from("users")
    .select("country, ships_internationally")
    .eq("wallet_address", auction.seller_wallet)
    .maybeSingle();

  if (sellerError) throw sellerError;

  const isExempt = isShippingExemptAuction(auction);
  const shippingUsd = resolveShippingUsd({
    domesticShippingUsd: auction.domestic_shipping_usd,
    internationalShippingUsd: auction.international_shipping_usd,
    sellerCountry: (seller?.country as string | null) ?? null,
    buyerCountry: address.country,
    shipsInternationally: Boolean(seller?.ships_internationally),
    isExempt,
  });

  if (shippingUsd === null) {
    throw new BuyNowError("This seller does not ship to the selected country.");
  }

  const thread = await ensureBuyNowThread(auction, buyerWallet, db);

  const { error: updateError } = await db
    .from("message_threads")
    .update({
      shipping_address_id: address.id,
      shipping_usd: shippingUsd,
      shipping_country: address.country,
    })
    .eq("id", thread.id);

  if (updateError) {
    logSupabaseError("confirmBuyNowShippingAddress", updateError);
    throw new BuyNowError("Unable to save shipping address. Please try again.");
  }

  return {
    shippingUsd,
    shippingCountry: address.country,
    threadId: thread.id,
    address,
  };
}

export async function verifyBuyNowPaymentShipping({
  auctionId,
  buyerWallet,
  client = supabase,
}: {
  auctionId: string;
  buyerWallet: string;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  bidAmountSol: number;
  threadId: string;
}> {
  const auction = await verifyBuyNowAvailable(auctionId, buyerWallet, client);
  const db = client ?? getAuthenticatedClient(buyerWallet);
  const buyNowPrice = getBuyNowPrice(auction);

  if (!buyNowPrice || buyNowPrice <= 0) {
    throw new BuyNowError("Buy Now is not available for this listing.");
  }

  const { data: thread, error: threadError } = await db
    .from("message_threads")
    .select("*")
    .eq("auction_id", auctionId.trim())
    .eq("buyer_wallet", buyerWallet.trim())
    .maybeSingle();

  if (threadError) throw threadError;
  if (!thread?.shipping_address_id || thread.shipping_usd == null) {
    throw new BuyNowError("Confirm your shipping address before paying.");
  }

  return {
    shippingUsd: Number(thread.shipping_usd),
    bidAmountSol: buyNowPrice,
    threadId: thread.id as string,
  };
}

async function insertBuyNowSummaryMessage(
  threadId: string,
  auction: Auction,
  priceSol: number,
  client: SupabaseClient
): Promise<void> {
  const itemDetails = auction.item_details ?? {};
  const summary: AuctionSummaryPayload = {
    type: "auction_summary",
    title: auction.title,
    image_url: auction.image_url,
    category: auction.category,
    condition: auction.condition,
    item_details: itemDetails,
    grading_company: itemDetails.grading_company ?? null,
    grade: itemDetails.grade ?? null,
    grade_label: itemDetails.grade_label ?? null,
    winning_bid: priceSol,
    reference_number: auction.reference_number,
    auction_id: auction.id,
  };

  await insertThreadSystemMessage(
    threadId,
    JSON.stringify(summary),
    auction.seller_wallet,
    client
  );
}

const LAMPORTS_PER_SOL = 1_000_000_000;

async function getPreviousHighestBidder(
  auctionId: string,
  client: SupabaseClient
): Promise<string | null> {
  const { data, error } = await client
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", auctionId.trim())
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const wallet = (data?.bidder_wallet as string | null)?.trim();
  return wallet || null;
}

export async function completeBuyNowPurchase({
  auctionId,
  buyerWallet,
  threadId,
  client = supabase,
}: {
  auctionId: string;
  buyerWallet: string;
  threadId?: string | null;
  client?: SupabaseClient;
}): Promise<{ threadId: string }> {
  const normalizedBuyer = buyerWallet.trim();
  const db = client ?? getAuthenticatedClient(normalizedBuyer);

  const { data: current, error: loadError } = await db
    .from("auctions")
    .select("*")
    .eq("id", auctionId.trim())
    .maybeSingle();

  if (loadError) throw loadError;
  if (!current) {
    throw new BuyNowError("Listing not found.");
  }

  const auction = parseAuctionRow(current as Record<string, unknown>);
  const buyNowPrice = getBuyNowPrice(auction);

  if (!buyNowPrice || buyNowPrice <= 0) {
    throw new BuyNowError("Buy Now is not available for this listing.");
  }

  const now = new Date().toISOString();
  const endTimeUpdate = isGoodTillCancelled(auction) ? now : auction.end_time;

  let previousHighestBidder: string | null = null;
  if (auction.listing_type === "auction_buy_now") {
    previousHighestBidder = await getPreviousHighestBidder(auctionId, db);
  }

  const { data: updated, error: updateError } = await db
    .from("auctions")
    .update({
      status: "ended",
      winner_wallet: normalizedBuyer,
      purchase_type: "buy_now",
      current_bid: buyNowPrice,
      end_time: endTimeUpdate,
    })
    .eq("id", auctionId.trim())
    .eq("status", "live")
    .eq("escrow_funded", true)
    .is("winner_wallet", null)
    .select("*")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    throw new BuyNowError(BUY_NOW_RACE_ERROR);
  }

  const endedAuction = parseAuctionRow(updated as Record<string, unknown>);

  await upsertUser(normalizedBuyer, db);
  await upsertUser(endedAuction.seller_wallet, db);

  let resolvedThreadId = threadId?.trim() ?? "";
  if (!resolvedThreadId) {
    const thread = await ensureBuyNowThread(endedAuction, normalizedBuyer, db);
    resolvedThreadId = thread.id;
  }

  const { data: existingSummary } = await db
    .from("direct_messages")
    .select("id")
    .eq("thread_id", resolvedThreadId)
    .limit(1)
    .maybeSingle();

  if (!existingSummary) {
    await insertBuyNowSummaryMessage(
      resolvedThreadId,
      endedAuction,
      buyNowPrice,
      db
    );
  }

  try {
    await notifyBuyNowBuyer({
      buyerWallet: normalizedBuyer,
      auctionTitle: endedAuction.title,
      priceSol: buyNowPrice,
      threadId: resolvedThreadId,
    }, db);
    await notifyBuyNowSeller({
      sellerWallet: endedAuction.seller_wallet,
      auctionTitle: endedAuction.title,
      priceSol: buyNowPrice,
      threadId: resolvedThreadId,
    }, db);

    if (
      previousHighestBidder &&
      previousHighestBidder !== normalizedBuyer
    ) {
      await notifyBuyNowOutbidBidder({
        bidderWallet: previousHighestBidder,
        auctionTitle: endedAuction.title,
        auctionId: endedAuction.id,
      }, db);
    }

    if (endedAuction.escrow_funded) {
      const totalSol =
        endedAuction.escrow_amount_lamports != null &&
        endedAuction.escrow_amount_lamports > 0
          ? endedAuction.escrow_amount_lamports / LAMPORTS_PER_SOL
          : buyNowPrice;

      await notifyPaymentConfirmed({
        buyerWallet: normalizedBuyer,
        sellerWallet: endedAuction.seller_wallet,
        auctionTitle: endedAuction.title,
        threadId: resolvedThreadId,
        totalSol,
      });
    }
  } catch (notifyError) {
    logSupabaseError("completeBuyNowPurchase:notify", notifyError);
  }

  return { threadId: resolvedThreadId };
}
