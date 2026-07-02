import {
  canShipToBuyer,
  isShippingExemptAuction,
} from "@/lib/auction-shipping";
import {
  fetchActiveBuyerStrikes,
  summarizeBuyerStrikes,
} from "@/lib/buyer-strikes";
import { getMinimumBidIncrement } from "@/lib/bid-utils";
import { logSupabaseError } from "@/lib/errors";
import {
  getUserDisplayName,
  notifyBidPlaced,
} from "@/lib/notifications";
import { getDefaultShippingAddress } from "@/lib/shipping";
import { getAuthenticatedClient, supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export const MAX_BID_AMOUNT_SOL = 10_000;

export class BidPlacementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BidPlacementError";
  }
}

/** Server-side bid placement with validation. Throws BidPlacementError for client errors. */
export async function placeBidWithValidation({
  auctionId,
  bidderWallet,
  amount,
}: {
  auctionId: string;
  bidderWallet: string;
  amount: number;
}) {
  if (!auctionId?.trim()) {
    throw new BidPlacementError("Auction is required.");
  }

  if (!bidderWallet?.trim()) {
    throw new BidPlacementError("Wallet address is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BidPlacementError("Bid amount must be a positive number.");
  }

  if (amount > MAX_BID_AMOUNT_SOL) {
    throw new BidPlacementError(
      `Bid amount cannot exceed ${MAX_BID_AMOUNT_SOL} SOL.`
    );
  }

  const [{ data: auction, error: auctionError }, { data: previousTopBid }] =
    await Promise.all([
      supabase
        .from("auctions")
        .select(
          "id, title, seller_wallet, current_bid, start_price, is_dummy, status, end_time"
        )
        .eq("id", auctionId)
        .maybeSingle(),
      supabase
        .from("bids")
        .select("bidder_wallet")
        .eq("auction_id", auctionId)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (auctionError) {
    logSupabaseError("placeBidWithValidation: fetch auction", auctionError);
    throw new Error("Unable to place bid. Please try again.");
  }

  if (!auction) {
    throw new BidPlacementError("Auction not found.");
  }

  if (auction.status !== "live") {
    throw new BidPlacementError("This auction is not live.");
  }

  if (new Date(auction.end_time as string).getTime() <= Date.now()) {
    throw new BidPlacementError("This auction has ended.");
  }

  const currentBid = Number(auction.current_bid);
  const startPrice = Number(auction.start_price);

  if (!Number.isFinite(currentBid) || !Number.isFinite(startPrice)) {
    throw new Error("Unable to place bid. Please try again.");
  }

  const floor = Math.max(currentBid, startPrice);
  const increment = getMinimumBidIncrement(floor);
  const minimumBid = Math.round((floor + increment) * 100) / 100;

  if (amount < minimumBid) {
    throw new BidPlacementError(
      `Minimum bid is ${minimumBid} SOL (${floor} + ${increment} minimum increment)`
    );
  }

  if (bidderWallet === auction.seller_wallet) {
    throw new BidPlacementError("You cannot bid on your own auction.");
  }

  const activeStrikes = await fetchActiveBuyerStrikes(bidderWallet).catch(
    (error) => {
      logSupabaseError("placeBidWithValidation: fetch strikes", error);
      throw new Error("Unable to place bid. Please try again.");
    }
  );

  const strikeSummary = summarizeBuyerStrikes(activeStrikes);
  if (
    strikeSummary.status === "banned" ||
    strikeSummary.status === "suspended"
  ) {
    throw new BidPlacementError(
      strikeSummary.message ??
        "You are not allowed to place bids at this time."
    );
  }

  const isExempt = isShippingExemptAuction({
    is_dummy: Boolean(auction.is_dummy),
    seller_wallet: auction.seller_wallet as string,
  });

  const authClient = getAuthenticatedClient(bidderWallet);

  const defaultAddress = await getDefaultShippingAddress(
    bidderWallet,
    authClient
  ).catch(() => null);

  if (!isExempt && !defaultAddress) {
    throw new BidPlacementError(
      "Add a shipping address before placing a bid."
    );
  }

  if (!isExempt && defaultAddress) {
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("country, ships_internationally")
      .eq("wallet_address", auction.seller_wallet as string)
      .maybeSingle();

    if (sellerError) {
      logSupabaseError("placeBidWithValidation: fetch seller", sellerError);
      throw new Error("Unable to place bid. Please try again.");
    }

    if (
      seller &&
      !canShipToBuyer({
        sellerCountry: (seller.country as string | null) ?? null,
        shipsInternationally: Boolean(seller.ships_internationally),
        buyerCountry: defaultAddress.country,
        isExempt,
      })
    ) {
      throw new BidPlacementError("This seller doesn't ship to your country.");
    }
  }

  try {
    await upsertUser(bidderWallet);
    await upsertUser(auction.seller_wallet as string);
  } catch (userError) {
    logSupabaseError("placeBidWithValidation: upsert user", userError);
    throw new Error("Unable to place bid. Please try again.");
  }

  const { error: bidError } = await supabase.from("bids").insert({
    auction_id: auctionId,
    bidder_wallet: bidderWallet,
    amount,
  });

  if (bidError) {
    logSupabaseError("placeBidWithValidation: insert bid", bidError);
    throw new Error("Unable to place bid. Please try again.");
  }

  const { error: updateError } = await supabase
    .from("auctions")
    .update({ current_bid: amount })
    .eq("id", auctionId);

  if (updateError) {
    logSupabaseError("placeBidWithValidation: update auction", updateError);
    throw new Error("Unable to place bid. Please try again.");
  }

  const bidderDisplayName = await getUserDisplayName(bidderWallet);

  if (
    previousTopBid?.bidder_wallet &&
    previousTopBid.bidder_wallet !== bidderWallet
  ) {
    try {
      await upsertUser(previousTopBid.bidder_wallet as string);
    } catch (userError) {
      logSupabaseError("placeBidWithValidation: upsert previous bidder", userError);
    }
  }

  await notifyBidPlaced({
    bidderWallet,
    sellerWallet: auction.seller_wallet as string,
    previousBidderWallet:
      (previousTopBid?.bidder_wallet as string | undefined) ?? null,
    auctionId,
    auctionTitle: auction.title as string,
    amount,
    bidderDisplayName,
  });
}
