import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase } from "@/lib/supabase";
import type { Auction } from "@/lib/database.types";

import { computeTransactionAmounts } from "./amounts";
import { mapBuyerDisplayStatus, mapSellerDisplayStatus } from "./status";
import type {
  BuyerTransactionRow,
  SellerTransactionRow,
  TransactionsData,
} from "./types";

async function getTopBidderByAuction(
  auctionIds: string[]
): Promise<Map<string, string>> {
  if (!auctionIds.length) return new Map();

  const { data, error } = await supabase
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

function getTransactionDate(auction: Auction): string {
  return (
    auction.escrow_funded_at ??
    auction.end_time ??
    auction.created_at
  );
}

function buildSellerRow(
  auction: Auction,
  buyerWallet: string,
  solUsdRate: number
): SellerTransactionRow | null {
  const displayStatus = mapSellerDisplayStatus(auction.escrow_state);
  if (!displayStatus) return null;

  return {
    role: "selling",
    auctionId: auction.id,
    reference: auction.reference_number,
    itemTitle: auction.title,
    buyerWallet,
    date: getTransactionDate(auction),
    amounts: computeTransactionAmounts(auction, solUsdRate),
    escrowState: auction.escrow_state,
    displayStatus,
    txSignature: auction.escrow_tx_signature,
    category: auction.category,
  };
}

function buildBuyerRow(
  auction: Auction,
  solUsdRate: number
): BuyerTransactionRow | null {
  const displayStatus = mapBuyerDisplayStatus(auction.escrow_state);
  if (!displayStatus) return null;

  return {
    role: "buying",
    auctionId: auction.id,
    reference: auction.reference_number,
    itemTitle: auction.title,
    sellerWallet: auction.seller_wallet,
    date: getTransactionDate(auction),
    amounts: computeTransactionAmounts(auction, solUsdRate),
    escrowState: auction.escrow_state,
    displayStatus,
    txSignature: auction.escrow_tx_signature,
    category: auction.category,
  };
}

export async function fetchTransactionsData(
  wallet: string,
  solUsdRate: number
): Promise<TransactionsData> {
  const normalizedWallet = wallet.trim();

  const [sellerResponse, buyerBidsResponse, listingCountResponse] =
    await Promise.all([
      supabase
        .from("auctions")
        .select("*")
        .eq("seller_wallet", normalizedWallet)
        .eq("escrow_funded", true)
        .order("escrow_funded_at", { ascending: false }),
      supabase
        .from("bids")
        .select("auction_id")
        .eq("bidder_wallet", normalizedWallet),
      supabase
        .from("auctions")
        .select("id", { count: "exact", head: true })
        .eq("seller_wallet", normalizedWallet),
    ]);

  if (sellerResponse.error) throw sellerResponse.error;
  if (buyerBidsResponse.error) throw buyerBidsResponse.error;
  if (listingCountResponse.error) throw listingCountResponse.error;

  const sellerAuctions = (sellerResponse.data ?? []).map((row) =>
    parseAuctionRow(row as Record<string, unknown>)
  );

  const buyerAuctionIds = [
    ...new Set(
      (buyerBidsResponse.data ?? []).map((row) => row.auction_id as string)
    ),
  ];

  let buyerAuctions: Auction[] = [];
  if (buyerAuctionIds.length) {
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .in("id", buyerAuctionIds)
      .eq("escrow_funded", true);

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
  const topBidders = await getTopBidderByAuction(allIds);

  const sellerRows: SellerTransactionRow[] = [];
  for (const auction of sellerAuctions) {
    const buyerWallet = topBidders.get(auction.id) ?? "Unknown";
    const row = buildSellerRow(auction, buyerWallet, solUsdRate);
    if (row) sellerRows.push(row);
  }

  const buyerRows: BuyerTransactionRow[] = [];
  for (const auction of buyerAuctions) {
    if (topBidders.get(auction.id) !== normalizedWallet) continue;
    const row = buildBuyerRow(auction, solUsdRate);
    if (row) buyerRows.push(row);
  }

  const hasSellerListings = (listingCountResponse.count ?? 0) > 0;

  return { sellerRows, buyerRows, hasSellerListings };
}
