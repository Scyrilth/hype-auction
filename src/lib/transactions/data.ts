import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase, type SupabaseClient } from "@/lib/supabase";
import type { Auction } from "@/lib/database.types";

import { computeTransactionAmounts } from "./amounts";
import {
  isTransactionEscrowState,
  mapBuyerDisplayStatus,
  mapSellerDisplayStatus,
} from "./status";
import type {
  BuyerTransactionRow,
  SellerTransactionRow,
  TransactionsData,
} from "./types";

const AUCTION_TX_COLUMNS =
  "id, title, reference_number, seller_wallet, current_bid, start_price, end_time, created_at, status, category, escrow_state, escrow_tx_signature, escrow_amount_lamports, domestic_shipping_usd, international_shipping_usd, sol_usd_rate_at_payment, payment_completed_at";

async function getTopBidderByAuction(
  auctionIds: string[],
  client: SupabaseClient
): Promise<Map<string, string>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await client
    .from("bids")
    .select("auction_id, bidder_wallet, amount")
    .in("auction_id", auctionIds)
    .order("amount", { ascending: false });

  if (error) throw error;

  const winners = new Map<string, string>();
  for (const row of data ?? []) {
    const auctionId = row.auction_id as string;
    if (!winners.has(auctionId)) {
      winners.set(auctionId, row.bidder_wallet as string);
    }
  }
  return winners;
}

/** Prefer payment_completed_at, then end_time, then created_at. */
export function getTransactionDate(auction: Auction): string {
  return (
    auction.payment_completed_at ??
    auction.end_time ??
    auction.created_at
  );
}

function buildSellerRow(
  auction: Auction,
  buyerWallet: string,
  currentRateFallback: number
): SellerTransactionRow | null {
  if (!isTransactionEscrowState(auction.escrow_state)) return null;

  const displayStatus = mapSellerDisplayStatus(auction.escrow_state);
  if (!displayStatus) return null;

  return {
    role: "selling",
    auctionId: auction.id,
    reference: auction.reference_number,
    itemTitle: auction.title,
    buyerWallet,
    date: getTransactionDate(auction),
    amounts: computeTransactionAmounts(auction, currentRateFallback),
    escrowState: auction.escrow_state,
    displayStatus,
    txSignature: auction.escrow_tx_signature,
    category: auction.category,
    solUsdRateAtPayment: auction.sol_usd_rate_at_payment,
    paymentCompletedAt: auction.payment_completed_at,
  };
}

function buildBuyerRow(
  auction: Auction,
  currentRateFallback: number
): BuyerTransactionRow | null {
  if (!isTransactionEscrowState(auction.escrow_state)) return null;

  const displayStatus = mapBuyerDisplayStatus(auction.escrow_state);
  if (!displayStatus) return null;

  return {
    role: "buying",
    auctionId: auction.id,
    reference: auction.reference_number,
    itemTitle: auction.title,
    sellerWallet: auction.seller_wallet,
    date: getTransactionDate(auction),
    amounts: computeTransactionAmounts(auction, currentRateFallback),
    escrowState: auction.escrow_state,
    displayStatus,
    txSignature: auction.escrow_tx_signature,
    category: auction.category,
    solUsdRateAtPayment: auction.sol_usd_rate_at_payment,
    paymentCompletedAt: auction.payment_completed_at,
  };
}

export async function fetchTransactionsData(
  wallet: string,
  currentRateFallback: number,
  client: SupabaseClient = supabase
): Promise<TransactionsData> {
  const normalizedWallet = wallet.trim();

  const [sellerResponse, buyerBidsResponse, listingCountResponse] =
    await Promise.all([
      client
        .from("auctions")
        .select(AUCTION_TX_COLUMNS)
        .eq("seller_wallet", normalizedWallet)
        .eq("status", "ended")
        .order("end_time", { ascending: false }),
      client
        .from("bids")
        .select("auction_id")
        .eq("bidder_wallet", normalizedWallet),
      client
        .from("auctions")
        .select("id", { count: "exact", head: true })
        .eq("seller_wallet", normalizedWallet),
    ]);

  if (sellerResponse.error) throw sellerResponse.error;
  if (buyerBidsResponse.error) throw buyerBidsResponse.error;
  if (listingCountResponse.error) throw listingCountResponse.error;

  const sellerAuctions = [
    ...new Map(
      (sellerResponse.data ?? []).map((row) => {
        const auction = parseAuctionRow(row as Record<string, unknown>);
        return [auction.id, auction] as const;
      })
    ).values(),
  ];

  const buyerAuctionIds = [
    ...new Set(
      (buyerBidsResponse.data ?? []).map((row) => row.auction_id as string)
    ),
  ];

  let buyerAuctions: Auction[] = [];
  if (buyerAuctionIds.length) {
    const { data, error } = await client
      .from("auctions")
      .select(AUCTION_TX_COLUMNS)
      .in("id", buyerAuctionIds)
      .eq("status", "ended");

    if (error) throw error;
    buyerAuctions = (data ?? []).map((row) =>
      parseAuctionRow(row as Record<string, unknown>)
    );
  }

  const allIds = [
    ...new Set([
      ...sellerAuctions.map((a) => a.id),
      ...buyerAuctions.map((a) => a.id),
    ]),
  ];
  const topBidders = await getTopBidderByAuction(allIds, client);

  const sellerRowsMap = new Map<string, SellerTransactionRow>();
  for (const auction of sellerAuctions) {
    const buyerWallet = topBidders.get(auction.id) ?? "Unknown";
    const row = buildSellerRow(auction, buyerWallet, currentRateFallback);
    if (!row) continue;

    const existing = sellerRowsMap.get(row.auctionId);
    if (!existing) {
      sellerRowsMap.set(row.auctionId, row);
      continue;
    }
    if (existing.buyerWallet === "Unknown" && row.buyerWallet !== "Unknown") {
      sellerRowsMap.set(row.auctionId, row);
    }
  }
  const sellerRows = [...sellerRowsMap.values()];

  const buyerRows: BuyerTransactionRow[] = [];
  for (const auction of buyerAuctions) {
    if (topBidders.get(auction.id) !== normalizedWallet) continue;
    const row = buildBuyerRow(auction, currentRateFallback);
    if (row) buyerRows.push(row);
  }

  const hasSellerListings = (listingCountResponse.count ?? 0) > 0;

  return { sellerRows, buyerRows, hasSellerListings };
}
