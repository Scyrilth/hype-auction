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
import { getNotificationClient, supabase, type SupabaseClient } from "@/lib/supabase";

const THREAD_SELECT =
  "id, buyer_wallet, seller_wallet, auction_id, escrow_status, shipping_address_id, shipping_usd, shipping_country";

function getThreadShippingClient(client?: SupabaseClient): SupabaseClient {
  return client ?? getNotificationClient();
}

async function fetchThreadRowById(
  threadId: string,
  client: SupabaseClient
): Promise<{ row: Record<string, unknown> | null; error: Error | null }> {
  const { data, error } = await client
    .from("message_threads")
    .select(THREAD_SELECT)
    .eq("id", threadId.trim())
    .maybeSingle();

  if (error) {
    console.error("[thread-shipping] Supabase thread lookup by id failed", {
      threadId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { row: null, error };
  }

  return { row: (data as Record<string, unknown> | null) ?? null, error: null };
}

async function fetchThreadRowByAuctionBuyer(
  auctionId: string,
  buyerWallet: string,
  client: SupabaseClient
): Promise<{ row: Record<string, unknown> | null; error: Error | null }> {
  const normalizedBuyer = buyerWallet.trim();
  const normalizedAuctionId = auctionId.trim();

  const { data: directThreads, error: directError } = await client
    .from("message_threads")
    .select(THREAD_SELECT)
    .eq("auction_id", normalizedAuctionId)
    .eq("buyer_wallet", normalizedBuyer)
    .limit(1);

  if (directError) {
    console.error("[thread-shipping] Supabase auction+buyer thread lookup failed", {
      auctionId: normalizedAuctionId,
      buyerWallet: normalizedBuyer,
      code: directError.code,
      message: directError.message,
      details: directError.details,
      hint: directError.hint,
    });
    return { row: null, error: directError };
  }

  if (directThreads?.[0]) {
    return { row: directThreads[0] as Record<string, unknown>, error: null };
  }

  const { data: auction, error: auctionError } = await client
    .from("auctions")
    .select("next_bidder_wallet")
    .eq("id", normalizedAuctionId)
    .maybeSingle();

  if (auctionError) {
    console.error("[thread-shipping] Supabase auction lookup for thread fallback failed", {
      auctionId: normalizedAuctionId,
      code: auctionError.code,
      message: auctionError.message,
      details: auctionError.details,
      hint: auctionError.hint,
    });
    return { row: null, error: auctionError };
  }

  const nextBidderWallet = (auction?.next_bidder_wallet as string | null)?.trim();
  if (nextBidderWallet === normalizedBuyer) {
    const { data: offerThreads, error: offerThreadError } = await client
      .from("message_threads")
      .select(THREAD_SELECT)
      .eq("auction_id", normalizedAuctionId)
      .limit(1);

    if (offerThreadError) {
      console.error("[thread-shipping] Supabase next-bidder thread lookup failed", {
        auctionId: normalizedAuctionId,
        buyerWallet: normalizedBuyer,
        code: offerThreadError.code,
        message: offerThreadError.message,
        details: offerThreadError.details,
        hint: offerThreadError.hint,
      });
      return { row: null, error: offerThreadError };
    }

    if (offerThreads?.[0]) {
      return { row: offerThreads[0] as Record<string, unknown>, error: null };
    }
  }

  return { row: null, error: null };
}

async function resolveThreadForBuyerShipping({
  threadId,
  buyerWallet,
  auctionId,
  client = supabase,
}: {
  threadId?: string | null;
  buyerWallet: string;
  auctionId?: string | null;
  client?: SupabaseClient;
}): Promise<Record<string, unknown>> {
  const db = getThreadShippingClient(client);
  const normalizedThreadId = threadId?.trim() ?? "";
  const normalizedBuyer = buyerWallet.trim();

  if (normalizedThreadId) {
    const byId = await fetchThreadRowById(normalizedThreadId, db);
    if (byId.error) throw byId.error;
    if (byId.row) {
      return byId.row;
    }
  }

  if (auctionId?.trim()) {
    console.warn("[thread-shipping] thread not found by id; trying auction fallback", {
      threadId: normalizedThreadId,
      auctionId: auctionId.trim(),
      buyerWallet: normalizedBuyer,
    });

    const byAuction = await fetchThreadRowByAuctionBuyer(
      auctionId,
      normalizedBuyer,
      db
    );
    if (byAuction.error) throw byAuction.error;
    if (byAuction.row) {
      console.log("[thread-shipping] resolved thread via auction fallback", {
        requestedThreadId: normalizedThreadId,
        resolvedThreadId: byAuction.row.id,
        auctionId: auctionId.trim(),
        buyerWallet: normalizedBuyer,
      });
      return byAuction.row;
    }
  }

  console.error("[thread-shipping] conversation not found after lookup attempts", {
    threadId: normalizedThreadId || null,
    auctionId: auctionId?.trim() ?? null,
    buyerWallet: normalizedBuyer,
  });
  throw new ThreadShippingError("Conversation not found.");
}

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
  auctionId,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  auctionId?: string | null;
  client?: SupabaseClient;
}) {
  const db = getThreadShippingClient(client);
  const normalizedBuyer = buyerWallet.trim();
  const thread = await resolveThreadForBuyerShipping({
    threadId,
    buyerWallet: normalizedBuyer,
    auctionId,
    client: db,
  });
  const effectiveThreadId = thread.id as string;

  if (!thread.auction_id) {
    throw new ThreadShippingError("This conversation is not linked to an auction.");
  }

  const { data: auction, error: auctionError } = await db
    .from("auctions")
    .select(
      "id, status, escrow_state, current_bid, start_price, next_bidder_wallet, is_dummy, seller_wallet, domestic_shipping_usd, international_shipping_usd"
    )
    .eq("id", thread.auction_id as string)
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

  const { data: topBid, error: topBidError } = await db
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", thread.auction_id as string)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (topBidError) throw topBidError;

  const topBidderWallet = (topBid?.bidder_wallet as string | null)?.trim() ?? null;

  const isNextBidderBuyer =
    (auction.next_bidder_wallet as string | null)?.trim() === normalizedBuyer;
  const acceptedOfferAmount = isNextBidderBuyer
    ? await getLatestAcceptedOfferAmount(effectiveThreadId, normalizedBuyer, db)
    : null;

  const isOriginalWinner =
    !(auction.next_bidder_wallet as string | null)?.trim() &&
    normalizedBuyer === (topBidderWallet ?? (thread.buyer_wallet as string).trim());

  const isAuthorizedBuyer =
    isOriginalWinner || (isNextBidderBuyer && acceptedOfferAmount !== null);

  if (!isAuthorizedBuyer) {
    throw new ThreadShippingError(
      "Only the winning buyer can confirm a shipping address."
    );
  }

  return { thread, auction, acceptedOfferAmount, effectiveThreadId };
}

export async function confirmThreadShippingAddress({
  threadId,
  buyerWallet,
  addressId,
  auctionId,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  addressId: string;
  auctionId?: string | null;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  shippingCountry: string;
  address: ShippingAddress;
  threadId: string;
}> {
  if (!addressId?.trim()) {
    throw new ThreadShippingError("Select a shipping address.");
  }

  const db = getThreadShippingClient(client);
  const { thread, auction, effectiveThreadId } =
    await assertBuyerCanConfirmThreadShipping({
      threadId,
      buyerWallet,
      auctionId,
      client: db,
    });

  const { data: addressRow, error: addressError } = await db
    .from("shipping_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("wallet_address", buyerWallet.trim())
    .maybeSingle();

  if (addressError) throw addressError;
  if (!addressRow) {
    throw new ThreadShippingError("Shipping address not found.");
  }

  const address = addressRow as ShippingAddress;

  const { data: seller, error: sellerError } = await db
    .from("users")
    .select("country, ships_internationally")
    .eq("wallet_address", thread.seller_wallet as string)
    .maybeSingle();

  if (sellerError) throw sellerError;

  const shippingUsd = parseShippingUsdForAddress({
    address,
    auction,
    sellerCountry: (seller?.country as string | null) ?? null,
    shipsInternationally: Boolean(seller?.ships_internationally),
  });

  const { error: updateError } = await db
    .from("message_threads")
    .update({
      shipping_address_id: address.id,
      shipping_usd: shippingUsd,
      shipping_country: address.country,
    })
    .eq("id", effectiveThreadId);

  if (updateError) {
    logSupabaseError("confirmThreadShippingAddress", updateError);
    throw new Error("Unable to save shipping address. Please try again.");
  }

  return {
    shippingUsd,
    shippingCountry: address.country,
    address,
    threadId: effectiveThreadId,
  };
}

export async function verifyThreadShippingForPayment({
  threadId,
  buyerWallet,
  auctionId,
  client = supabase,
}: {
  threadId: string;
  buyerWallet: string;
  auctionId?: string | null;
  client?: SupabaseClient;
}): Promise<{
  shippingUsd: number;
  shippingCountry: string;
  shippingAddressId: string;
  bidAmountSol: number;
  threadId: string;
}> {
  const db = getThreadShippingClient(client);
  const { thread, auction, acceptedOfferAmount } =
    await assertBuyerCanConfirmThreadShipping({
      threadId,
      buyerWallet,
      auctionId,
      client: db,
    });

  const shippingAddressId = thread.shipping_address_id as string | null;
  const storedShippingUsd = thread.shipping_usd as number | null;
  const storedCountry = thread.shipping_country as string | null;

  if (!shippingAddressId || storedShippingUsd === null || !storedCountry) {
    throw new ThreadShippingError(
      "Confirm your shipping address before paying."
    );
  }

  const { data: addressRow, error: addressError } = await db
    .from("shipping_addresses")
    .select("*")
    .eq("id", shippingAddressId)
    .eq("wallet_address", buyerWallet.trim())
    .maybeSingle();

  if (addressError) throw addressError;
  if (!addressRow) {
    throw new ThreadShippingError(
      "Selected shipping address is no longer available. Please choose another."
    );
  }

  const address = addressRow as ShippingAddress;

  const { data: seller, error: sellerError } = await db
    .from("users")
    .select("country, ships_internationally")
    .eq("wallet_address", thread.seller_wallet as string)
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
    threadId: thread.id as string,
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
