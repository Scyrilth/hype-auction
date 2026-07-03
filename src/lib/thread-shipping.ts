import {
  isShippingExemptAuction,
  resolveShippingUsd,
} from "@/lib/auction-shipping";
import { countriesMatch, getCountryName } from "@/lib/countries";
import { logSupabaseError } from "@/lib/errors";
import {
  parseNextBidderOfferMessage,
} from "@/lib/non-payment-resolution";
import type { ShippingAddress } from "@/lib/database.types";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export class ThreadShippingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThreadShippingError";
  }
}

export function formatThreadShippingRateLabel({
  buyerCountry,
  sellerCountry,
  domesticShippingUsd,
  internationalShippingUsd,
  shipsInternationally,
  isExempt = false,
}: {
  buyerCountry: string;
  sellerCountry: string | null;
  domesticShippingUsd: number;
  internationalShippingUsd: number;
  shipsInternationally: boolean;
  isExempt?: boolean;
}): string {
  if (isExempt) {
    return "Free shipping";
  }

  const shippingUsd = resolveShippingUsd({
    domesticShippingUsd,
    internationalShippingUsd,
    sellerCountry,
    buyerCountry,
    shipsInternationally,
    isExempt,
  });

  if (shippingUsd === null) {
    return "Shipping unavailable to this country";
  }

  if (shippingUsd <= 0) {
    return "Free shipping";
  }

  const isDomestic = countriesMatch(buyerCountry, sellerCountry);
  if (isDomestic) {
    return `Domestic shipping: $${shippingUsd.toFixed(2)}`;
  }

  return `International shipping: $${shippingUsd.toFixed(2)}`;
}

function parseShippingUsdForAddress({
  address,
  auction,
  sellerCountry,
  shipsInternationally,
}: {
  address: Pick<ShippingAddress, "country">;
  auction: {
    domestic_shipping_usd: number;
    international_shipping_usd: number;
    is_dummy?: boolean;
    seller_wallet?: string;
  };
  sellerCountry: string | null;
  shipsInternationally: boolean;
}): number {
  const isExempt = isShippingExemptAuction(auction);
  const shippingUsd = resolveShippingUsd({
    domesticShippingUsd: auction.domestic_shipping_usd,
    internationalShippingUsd: auction.international_shipping_usd,
    sellerCountry,
    buyerCountry: address.country,
    shipsInternationally,
    isExempt,
  });

  if (shippingUsd === null) {
    throw new ThreadShippingError(
      "This seller does not ship to the selected country."
    );
  }

  return shippingUsd;
}

async function getLatestAcceptedOfferAmount(
  threadId: string,
  bidderWallet: string,
  client: SupabaseClient
): Promise<number | null> {
  const { data: rows, error } = await client
    .from("direct_messages")
    .select("content")
    .eq("thread_id", threadId)
    .eq("is_system", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  for (const row of rows ?? []) {
    const offer = parseNextBidderOfferMessage(row.content as string);
    if (offer && offer.bidder_wallet === bidderWallet && offer.status === "accepted") {
      return offer.amount_sol;
    }
  }

  return null;
}

export async function assertBuyerCanConfirmThreadShipping({
  threadId,
  buyerWallet,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  client?: SupabaseClient;
}) {
  const { data: thread, error: threadError } = await client
    .from("message_threads")
    .select(
      "id, buyer_wallet, seller_wallet, auction_id, escrow_status, shipping_address_id, shipping_usd, shipping_country"
    )
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) throw threadError;
  if (!thread) {
    throw new ThreadShippingError("Conversation not found.");
  }

  if (thread.buyer_wallet !== buyerWallet) {
    throw new ThreadShippingError("Only the buyer can confirm a shipping address.");
  }

  if (!thread.auction_id) {
    throw new ThreadShippingError("This conversation is not linked to an auction.");
  }

  const { data: auction, error: auctionError } = await client
    .from("auctions")
    .select(
      "id, status, escrow_state, current_bid, start_price, next_bidder_wallet, is_dummy, seller_wallet, domestic_shipping_usd, international_shipping_usd"
    )
    .eq("id", thread.auction_id)
    .maybeSingle();

  if (auctionError) throw auctionError;
  if (!auction) {
    throw new ThreadShippingError("Auction not found.");
  }

  if (auction.status !== "ended") {
    throw new ThreadShippingError("Shipping can only be confirmed after the auction ends.");
  }

  const escrowState =
    (thread.escrow_status as string | null) ??
    (auction.escrow_state as string | null) ??
    null;

  if (escrowState && !["none", "pending", null].includes(escrowState)) {
    throw new ThreadShippingError(
      "Shipping address cannot be changed after payment."
    );
  }

  const isNextBidderBuyer =
    auction.next_bidder_wallet === buyerWallet &&
    thread.buyer_wallet === buyerWallet;
  const acceptedOfferAmount = isNextBidderBuyer
    ? await getLatestAcceptedOfferAmount(threadId, buyerWallet, client)
    : null;

  const isOriginalWinner =
    !auction.next_bidder_wallet && thread.buyer_wallet === buyerWallet;

  if (!isOriginalWinner && !(isNextBidderBuyer && acceptedOfferAmount !== null)) {
    throw new ThreadShippingError(
      "Only the winning buyer can confirm a shipping address."
    );
  }

  return { thread, auction, acceptedOfferAmount };
}

export async function confirmThreadShippingAddress({
  threadId,
  buyerWallet,
  addressId,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  addressId: string;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  shippingCountry: string;
  address: ShippingAddress;
}> {
  if (!addressId?.trim()) {
    throw new ThreadShippingError("Select a shipping address.");
  }

  const { thread, auction } = await assertBuyerCanConfirmThreadShipping({
    threadId,
    buyerWallet,
    client,
  });

  const { data: addressRow, error: addressError } = await client
    .from("shipping_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("wallet_address", buyerWallet)
    .maybeSingle();

  if (addressError) throw addressError;
  if (!addressRow) {
    throw new ThreadShippingError("Shipping address not found.");
  }

  const address = addressRow as ShippingAddress;

  const { data: seller, error: sellerError } = await client
    .from("users")
    .select("country, ships_internationally")
    .eq("wallet_address", thread.seller_wallet)
    .maybeSingle();

  if (sellerError) throw sellerError;

  const shippingUsd = parseShippingUsdForAddress({
    address,
    auction,
    sellerCountry: (seller?.country as string | null) ?? null,
    shipsInternationally: Boolean(seller?.ships_internationally),
  });

  const { error: updateError } = await client
    .from("message_threads")
    .update({
      shipping_address_id: address.id,
      shipping_usd: shippingUsd,
      shipping_country: address.country,
    })
    .eq("id", threadId)
    .eq("buyer_wallet", buyerWallet);

  if (updateError) {
    logSupabaseError("confirmThreadShippingAddress", updateError);
    throw new Error("Unable to save shipping address. Please try again.");
  }

  return {
    shippingUsd,
    shippingCountry: address.country,
    address,
  };
}

export async function verifyThreadShippingForPayment({
  threadId,
  buyerWallet,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  shippingCountry: string;
  shippingAddressId: string;
  bidAmountSol: number;
}> {
  const { thread, auction, acceptedOfferAmount } =
    await assertBuyerCanConfirmThreadShipping({
      threadId,
      buyerWallet,
      client,
    });

  const shippingAddressId = thread.shipping_address_id as string | null;
  const storedShippingUsd = thread.shipping_usd as number | null;
  const storedCountry = thread.shipping_country as string | null;

  if (!shippingAddressId || storedShippingUsd === null || !storedCountry) {
    throw new ThreadShippingError(
      "Confirm your shipping address before paying."
    );
  }

  const { data: addressRow, error: addressError } = await client
    .from("shipping_addresses")
    .select("*")
    .eq("id", shippingAddressId)
    .eq("wallet_address", buyerWallet)
    .maybeSingle();

  if (addressError) throw addressError;
  if (!addressRow) {
    throw new ThreadShippingError(
      "Selected shipping address is no longer available. Please choose another."
    );
  }

  const address = addressRow as ShippingAddress;

  const { data: seller, error: sellerError } = await client
    .from("users")
    .select("country, ships_internationally")
    .eq("wallet_address", thread.seller_wallet)
    .maybeSingle();

  if (sellerError) throw sellerError;

  const shippingUsd = parseShippingUsdForAddress({
    address,
    auction,
    sellerCountry: (seller?.country as string | null) ?? null,
    shipsInternationally: Boolean(seller?.ships_internationally),
  });

  if (Math.abs(shippingUsd - Number(storedShippingUsd)) > 0.01) {
    throw new ThreadShippingError(
      "Shipping rate changed. Please confirm your address again."
    );
  }

  if (address.country !== storedCountry) {
    throw new ThreadShippingError(
      "Shipping address changed. Please confirm your address again."
    );
  }

  const bidAmountSol =
    acceptedOfferAmount ??
    (Number(auction.current_bid) > 0
      ? Number(auction.current_bid)
      : Number(auction.start_price));

  return {
    shippingUsd,
    shippingCountry: address.country,
    shippingAddressId,
    bidAmountSol,
  };
}

export async function lockThreadShippingAddressForAuction({
  threadId,
  auctionId,
  client = supabase,
}: {
  threadId: string;
  auctionId: string;
  client?: SupabaseClient;
}): Promise<void> {
  const { data: thread, error } = await client
    .from("message_threads")
    .select("shipping_address_id")
    .eq("id", threadId)
    .maybeSingle();

  if (error || !thread?.shipping_address_id) return;

  const { error: lockError } = await client
    .from("shipping_addresses")
    .update({ used_for_auction_id: auctionId })
    .eq("id", thread.shipping_address_id as string)
    .is("used_for_auction_id", null);

  if (lockError) {
    logSupabaseError("lockThreadShippingAddressForAuction", lockError);
  }
}

export function formatBuyerShippingCountryLabel(country: string | null | undefined) {
  if (!country?.trim()) return null;
  return getCountryName(country);
}
