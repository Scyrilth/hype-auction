import {
  auctionHasReleasedEvent,
  directionForWallet,
  fetchWalletLedgerEvents,
  getLedgerReadClient,
  lamportsToSol,
  mapLedgerEventToEscrowState,
  type EscrowTransactionWithAuction,
} from "@/lib/escrow-ledger";
import { type SupabaseClient } from "@/lib/supabase";

import {
  mapBuyerDisplayStatus,
  mapSellerDisplayStatus,
  resolveDisplayEscrowState,
} from "./status";
import type {
  BuyerTransactionRow,
  SellerTransactionRow,
  TransactionAmounts,
  TransactionsData,
} from "./types";

function buildAmountsFromLamports(
  amountLamports: number,
  solUsdRateAtPayment: number | null,
  domesticShippingUsd: number,
  currentRateFallback: number,
  ledgerBidLamports?: number | null,
  ledgerShippingLamports?: number | null
): TransactionAmounts {
  const totalSol = lamportsToSol(amountLamports);
  const stored = solUsdRateAtPayment;
  const solUsdRate =
    stored != null && Number.isFinite(stored) && stored > 0
      ? stored
      : currentRateFallback > 0
        ? currentRateFallback
        : 0;
  const usesHistoricalRate =
    stored != null && Number.isFinite(stored) && stored > 0;
  const shippingUsd = domesticShippingUsd;

  const hasLedgerSplit =
    ledgerBidLamports != null &&
    ledgerBidLamports > 0 &&
    ledgerShippingLamports != null &&
    ledgerShippingLamports > 0;

  if (hasLedgerSplit) {
    const itemSol = lamportsToSol(ledgerBidLamports);
    const shippingSol = lamportsToSol(ledgerShippingLamports);
    return {
      itemSol,
      shippingSol,
      shippingUsd,
      feeSol: 0,
      netSol: totalSol,
      totalSol,
      usdApprox: totalSol * solUsdRate,
      usdRateUsed: solUsdRate,
      usesHistoricalRate,
    };
  }

  const shippingSol = solUsdRate > 0 ? shippingUsd / solUsdRate : 0;
  const itemSol = Math.max(0, totalSol - shippingSol);
  const feeSol = 0;
  const netSol = totalSol;

  return {
    itemSol,
    shippingSol,
    shippingUsd,
    feeSol,
    netSol,
    totalSol,
    usdApprox: totalSol * solUsdRate,
    usdRateUsed: solUsdRate,
    usesHistoricalRate,
  };
}

function buildSellerRow(
  event: EscrowTransactionWithAuction,
  sellerWallet: string,
  currentRateFallback: number
): SellerTransactionRow | null {
  if (event.is_platform_fee) return null;

  const eventEscrowState = mapLedgerEventToEscrowState(event.event_type);
  const escrowState = resolveDisplayEscrowState(
    eventEscrowState,
    event.auction.escrow_state
  );
  const displayStatus = mapSellerDisplayStatus(escrowState);
  if (!displayStatus) return null;

  return {
    role: "selling",
    auctionId: event.auction_id,
    reference: event.auction.reference_number,
    itemTitle: event.auction.title,
    buyerWallet: event.buyer_wallet ?? "Unknown",
    date: event.created_at,
    amounts: buildAmountsFromLamports(
      event.amount_lamports,
      event.auction.sol_usd_rate_at_payment,
      event.auction.domestic_shipping_usd ?? 0,
      currentRateFallback,
      event.event_type === "funded" ? event.bid_lamports : null,
      event.event_type === "funded" ? event.shipping_lamports : null
    ),
    escrowState,
    displayStatus,
    txSignature: event.on_chain_signature,
    solscanUrl: event.solscan_url,
    direction: directionForWallet(event, sellerWallet),
    eventType: event.event_type,
    platformTransactionId: event.platform_transaction_id,
    category: event.auction.category,
    solUsdRateAtPayment: event.auction.sol_usd_rate_at_payment,
    paymentCompletedAt: event.auction.payment_completed_at,
  };
}

function buildBuyerRow(
  event: EscrowTransactionWithAuction,
  buyerWallet: string,
  currentRateFallback: number
): BuyerTransactionRow | null {
  if (event.is_platform_fee) return null;

  const normalizedBuyerWallet = buyerWallet.trim();
  if (
    event.event_type === "funded" &&
    event.from_wallet.trim() !== normalizedBuyerWallet
  ) {
    return null;
  }

  const eventEscrowState = mapLedgerEventToEscrowState(event.event_type);
  const escrowState = resolveDisplayEscrowState(
    eventEscrowState,
    event.auction.escrow_state
  );
  const displayStatus = mapBuyerDisplayStatus(escrowState);
  if (!displayStatus) return null;

  return {
    role: "buying",
    auctionId: event.auction_id,
    reference: event.auction.reference_number,
    itemTitle: event.auction.title,
    sellerWallet: event.auction.seller_wallet,
    fromWallet: event.from_wallet,
    date: event.created_at,
    amounts: buildAmountsFromLamports(
      event.amount_lamports,
      event.auction.sol_usd_rate_at_payment,
      event.auction.domestic_shipping_usd ?? 0,
      currentRateFallback,
      event.event_type === "funded" ? event.bid_lamports : null,
      event.event_type === "funded" ? event.shipping_lamports : null
    ),
    escrowState,
    displayStatus,
    txSignature: event.on_chain_signature,
    solscanUrl: event.solscan_url,
    direction: directionForWallet(event, buyerWallet),
    eventType: event.event_type,
    platformTransactionId: event.platform_transaction_id,
    category: event.auction.category,
    solUsdRateAtPayment: event.auction.sol_usd_rate_at_payment,
    paymentCompletedAt: event.auction.payment_completed_at,
  };
}

/** Prefer payment_completed_at, then event created_at. */
export function getTransactionDate(iso: string): string {
  return iso;
}

export async function fetchTransactionsData(
  wallet: string,
  currentRateFallback: number,
  client: SupabaseClient = getLedgerReadClient(wallet)
): Promise<TransactionsData> {
  const normalizedWallet = wallet.trim();

  const [events, listingCountResponse] = await Promise.all([
    fetchWalletLedgerEvents(normalizedWallet, client),
    client
      .from("auctions")
      .select("id", { count: "exact", head: true })
      .eq("seller_wallet", normalizedWallet),
  ]);

  if (listingCountResponse.error) throw listingCountResponse.error;

  const sellerRows = events
    .map((event) => buildSellerRow(event, normalizedWallet, currentRateFallback))
    .filter((row): row is SellerTransactionRow => row !== null);

  const buyerRows = events
    .map((event) => buildBuyerRow(event, normalizedWallet, currentRateFallback))
    .filter((row): row is BuyerTransactionRow => row !== null);

  const hasSellerListings = (listingCountResponse.count ?? 0) > 0;

  return { sellerRows, buyerRows, hasSellerListings };
}

export function isSellerAuctionPendingEscrow(
  events: EscrowTransactionWithAuction[],
  auctionId: string
): boolean {
  const hasFunded = events.some(
    (event) => event.auction_id === auctionId && event.event_type === "funded"
  );
  return hasFunded && !auctionHasReleasedEvent(events, auctionId);
}
