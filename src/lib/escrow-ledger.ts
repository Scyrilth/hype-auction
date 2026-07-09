import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import type { Auction, EscrowState } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import { isBrowserLedgerWrite, postEscrowLedgerEvent } from "@/lib/escrow-ledger-client";
import { PLATFORM_FEE_BPS, PLATFORM_WALLET } from "@/lib/escrow";
import { parseAuctionRow } from "@/lib/parse-auction";
import {
  getAuthenticatedClient,
  getNotificationClient,
  type SupabaseClient,
} from "@/lib/supabase";

export type EscrowLedgerEventType =
  | "funded"
  | "shipped"
  | "released"
  | "refunded"
  | "disputed"
  | "dispute_resolved"
  | "fee_collected";

export type EscrowLedgerDirection = "inward" | "outward";

export interface EscrowTransaction {
  id: string;
  platform_transaction_id: string;
  auction_id: string;
  thread_id: string | null;
  event_type: EscrowLedgerEventType;
  direction: EscrowLedgerDirection;
  from_wallet: string;
  to_wallet: string;
  amount_lamports: number;
  bid_lamports: number | null;
  shipping_lamports: number | null;
  is_platform_fee: boolean;
  on_chain_signature: string | null;
  solscan_url: string | null;
  escrow_pda: string | null;
  created_at: string;
}

export interface EscrowTransactionWithAuction extends EscrowTransaction {
  auction: Pick<
    Auction,
    | "id"
    | "title"
    | "reference_number"
    | "seller_wallet"
    | "category"
    | "escrow_state"
    | "shipping_status"
    | "tracking_number"
    | "tracking_courier"
    | "payment_completed_at"
    | "is_dummy"
    | "escrow_tx_signature"
    | "sol_usd_rate_at_payment"
    | "domestic_shipping_usd"
    | "listing_type"
    | "purchase_type"
  >;
  buyer_wallet: string | null;
}

const LEDGER_COLUMNS =
  "id, platform_transaction_id, auction_id, thread_id, event_type, direction, from_wallet, to_wallet, amount_lamports, bid_lamports, shipping_lamports, is_platform_fee, on_chain_signature, solscan_url, escrow_pda, created_at";

export function buildSolscanUrl(signature: string | null | undefined): string | null {
  const trimmed = signature?.trim();
  if (!trimmed || trimmed.startsWith("admin-db-")) return null;
  return `https://solscan.io/tx/${trimmed}`;
}

export function splitEscrowLamports(
  bidLamports: number,
  shippingLamports: number,
  feeBps = PLATFORM_FEE_BPS
): { sellerLamports: number; platformFeeLamports: number; totalLamports: number } {
  const platformFeeLamports = Math.floor((bidLamports * feeBps) / 10_000);
  const totalLamports = bidLamports + shippingLamports;
  return {
    sellerLamports: totalLamports - platformFeeLamports,
    platformFeeLamports,
    totalLamports,
  };
}

export async function getFundedEscrowSplit(
  auctionId: string,
  client: SupabaseClient = getNotificationClient()
): Promise<{ bidLamports: number; shippingLamports: number } | null> {
  const { data, error } = await client
    .from("escrow_transactions")
    .select("bid_lamports, shipping_lamports, amount_lamports")
    .eq("auction_id", auctionId)
    .eq("event_type", "funded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const bidLamports = Number(data.bid_lamports ?? 0);
  const shippingLamports = Number(data.shipping_lamports ?? 0);
  if (bidLamports > 0 || shippingLamports > 0) {
    return { bidLamports, shippingLamports };
  }

  const totalLamports = Number(data.amount_lamports ?? 0);
  if (totalLamports > 0) {
    return { bidLamports: totalLamports, shippingLamports: 0 };
  }

  return null;
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

function parseLedgerRow(row: Record<string, unknown>): EscrowTransaction {
  return {
    id: row.id as string,
    platform_transaction_id: row.platform_transaction_id as string,
    auction_id: row.auction_id as string,
    thread_id: (row.thread_id as string | null) ?? null,
    event_type: row.event_type as EscrowLedgerEventType,
    direction: row.direction as EscrowLedgerDirection,
    from_wallet: (row.from_wallet as string).trim(),
    to_wallet: (row.to_wallet as string).trim(),
    amount_lamports: Number(row.amount_lamports),
    bid_lamports:
      row.bid_lamports != null ? Number(row.bid_lamports) : null,
    shipping_lamports:
      row.shipping_lamports != null ? Number(row.shipping_lamports) : null,
    is_platform_fee: Boolean(row.is_platform_fee),
    on_chain_signature: (row.on_chain_signature as string | null) ?? null,
    solscan_url: (row.solscan_url as string | null) ?? null,
    escrow_pda: (row.escrow_pda as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

async function getWriteClient(): Promise<SupabaseClient> {
  return getNotificationClient();
}

function walletLedgerFilter(wallet: string): string {
  return `from_wallet.eq.${wallet},to_wallet.eq.${wallet}`;
}

export function getLedgerReadClient(wallet: string): SupabaseClient {
  return getAuthenticatedClient(wallet);
}

export function extractAuctionRefSuffix(referenceNumber: string): string {
  const trimmed = referenceNumber.trim();
  const dashIndex = trimmed.lastIndexOf("-");
  if (dashIndex < 0 || dashIndex === trimmed.length - 1) {
    throw new Error(`Invalid auction reference_number format: ${trimmed}`);
  }
  return trimmed.slice(dashIndex + 1).toUpperCase();
}

export function escrowEventTypeCode(eventType: EscrowLedgerEventType): string {
  switch (eventType) {
    case "funded":
      return "F";
    case "shipped":
      return "SH";
    case "released":
      return "R";
    case "fee_collected":
      return "FE";
    case "refunded":
      return "RF";
    case "disputed":
      return "D";
    case "dispute_resolved":
      return "DR";
  }
}

export function formatGlobalTransactionSeq(globalSeq: number): string {
  if (!Number.isFinite(globalSeq) || globalSeq < 1) {
    throw new Error("platform_transaction_seq must be a positive integer");
  }
  return String(Math.floor(globalSeq)).padStart(6, "0");
}

/** HA-TXN-{AUCTIONREF}-{TYPECODE}{GLOBALSEQ}, e.g. HA-TXN-S5KREM-F000001 */
export function formatPlatformTransactionId(
  referenceNumber: string,
  eventType: EscrowLedgerEventType,
  globalSeq: number
): string {
  const auctionRef = extractAuctionRefSuffix(referenceNumber);
  const typeCode = escrowEventTypeCode(eventType);
  const seq = formatGlobalTransactionSeq(globalSeq);
  return `HA-TXN-${auctionRef}-${typeCode}${seq}`;
}

async function nextPlatformTransactionSeq(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc("next_platform_transaction_id");
  if (error) throw error;
  const seq = Number(data);
  if (!Number.isFinite(seq) || seq < 1) {
    throw new Error("Invalid platform_transaction_seq value");
  }
  return seq;
}

async function resolveAuctionReferenceNumber(
  auctionId: string,
  client: SupabaseClient,
  provided?: string | null
): Promise<string> {
  const trimmed = provided?.trim();
  if (trimmed) return trimmed;

  const { data, error } = await client
    .from("auctions")
    .select("reference_number")
    .eq("id", auctionId)
    .maybeSingle();

  if (error) throw error;

  const referenceNumber = (data?.reference_number as string | null)?.trim();
  if (!referenceNumber) {
    throw new Error(`Missing reference_number for auction ${auctionId}`);
  }

  return referenceNumber;
}

export async function generatePlatformTransactionId(
  referenceNumber: string,
  eventType: EscrowLedgerEventType,
  client: SupabaseClient = getNotificationClient()
): Promise<string> {
  const seq = await nextPlatformTransactionSeq(client);
  return formatPlatformTransactionId(referenceNumber, eventType, seq);
}

async function signatureEventExists(
  signature: string,
  eventType: EscrowLedgerEventType,
  client: SupabaseClient
): Promise<boolean> {
  const { data, error } = await client
    .from("escrow_transactions")
    .select("id")
    .eq("on_chain_signature", signature)
    .eq("event_type", eventType)
    .limit(1)
    .maybeSingle();

  if (error) {
    logSupabaseError("escrow-ledger:signatureEventExists", error);
    return false;
  }

  return Boolean(data);
}

export async function insertEscrowTransaction(
  input: {
    auctionId: string;
    auctionReferenceNumber?: string | null;
    threadId?: string | null;
    eventType: EscrowLedgerEventType;
    direction: EscrowLedgerDirection;
    fromWallet: string;
    toWallet: string;
    amountLamports: number;
    bidLamports?: number | null;
    shippingLamports?: number | null;
    isPlatformFee?: boolean;
    onChainSignature?: string | null;
    escrowPda?: string | null;
    createdAt?: string;
    platformTransactionId?: string;
  }
): Promise<EscrowTransaction | null> {
  const db = await getWriteClient();
  const signature = input.onChainSignature?.trim() || null;

  if (signature && (await signatureEventExists(signature, input.eventType, db))) {
    return null;
  }

  const referenceNumber = await resolveAuctionReferenceNumber(
    input.auctionId,
    db,
    input.auctionReferenceNumber
  );

  const platformTransactionId =
    input.platformTransactionId ??
    (await generatePlatformTransactionId(referenceNumber, input.eventType, db));

  const row = {
    platform_transaction_id: platformTransactionId,
    auction_id: input.auctionId,
    thread_id: input.threadId ?? null,
    event_type: input.eventType,
    direction: input.direction,
    from_wallet: input.fromWallet,
    to_wallet: input.toWallet,
    amount_lamports: input.amountLamports,
    bid_lamports: input.bidLamports ?? null,
    shipping_lamports: input.shippingLamports ?? null,
    is_platform_fee: Boolean(input.isPlatformFee),
    on_chain_signature: signature,
    solscan_url: buildSolscanUrl(signature),
    escrow_pda: input.escrowPda ?? null,
    created_at: input.createdAt,
  };

  const { data, error } = await db
    .from("escrow_transactions")
    .insert(row)
    .select(LEDGER_COLUMNS)
    .single();

  if (error) {
    logSupabaseError("insertEscrowTransaction", error);
    throw error;
  }

  return parseLedgerRow(data as Record<string, unknown>);
}

async function resolveFundedLamportsFromAuction(
  auctionId: string,
  amountLamports: number,
  bidLamports: number,
  shippingLamports: number,
  db: SupabaseClient
): Promise<{ bidLamports: number; shippingLamports: number }> {
  if (
    bidLamports > 0 &&
    shippingLamports >= 0 &&
    bidLamports + shippingLamports === amountLamports
  ) {
    return { bidLamports, shippingLamports };
  }

  const { data, error } = await db
    .from("auctions")
    .select("domestic_shipping_usd, sol_usd_rate_at_payment")
    .eq("id", auctionId)
    .maybeSingle();

  if (error) {
    logSupabaseError("resolveFundedLamportsFromAuction", error);
    return { bidLamports, shippingLamports };
  }
  if (!data) {
    return { bidLamports, shippingLamports };
  }

  const shippingUsd = Number(data.domestic_shipping_usd ?? 0);
  const rate = Number(data.sol_usd_rate_at_payment ?? 0);
  let resolvedShipping = shippingLamports;
  if (resolvedShipping <= 0 && shippingUsd > 0 && rate > 0) {
    resolvedShipping = Math.ceil((shippingUsd / rate) * LAMPORTS_PER_SOL);
  }

  let resolvedBid = bidLamports;
  if (resolvedBid <= 0 && amountLamports > resolvedShipping) {
    resolvedBid = amountLamports - resolvedShipping;
  } else if (resolvedBid + resolvedShipping !== amountLamports) {
    resolvedBid = Math.max(0, amountLamports - resolvedShipping);
  }

  return {
    bidLamports: resolvedBid,
    shippingLamports: resolvedShipping,
  };
}

export async function logEscrowFunded({
  auctionId,
  auctionReferenceNumber,
  threadId,
  buyerWallet,
  escrowPda,
  amountLamports,
  bidLamports,
  shippingLamports,
  onChainSignature,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  buyerWallet: string;
  escrowPda: string;
  amountLamports: number;
  bidLamports: number;
  shippingLamports: number;
  onChainSignature: string;
}): Promise<void> {
  console.log("[escrow-ledger] logEscrowFunded called", {
    auctionId,
    threadId: threadId ?? null,
    buyerWallet,
    escrowPda,
    amountLamports,
    bidLamports,
    shippingLamports,
    onChainSignature,
  });

  if (isBrowserLedgerWrite()) {
    await postEscrowLedgerEvent(
      {
        type: "funded",
        auctionId,
        threadId,
        buyerWallet,
        escrowPda,
        amountLamports,
        bidLamports,
        shippingLamports,
        onChainSignature,
      },
      buyerWallet
    );
    return;
  }

  const db = await getWriteClient();
  const { bidLamports: resolvedBid, shippingLamports: resolvedShipping } =
    await resolveFundedLamportsFromAuction(
      auctionId,
      amountLamports,
      bidLamports,
      shippingLamports,
      db
    );

  await insertEscrowTransaction({
    auctionId,
    auctionReferenceNumber,
    threadId,
    eventType: "funded",
    direction: "outward",
    fromWallet: buyerWallet,
    toWallet: escrowPda,
    amountLamports,
    bidLamports: resolvedBid,
    shippingLamports: resolvedShipping,
    onChainSignature,
    escrowPda,
  });
}

export async function logEscrowShipped({
  auctionId,
  auctionReferenceNumber,
  threadId,
  sellerWallet,
  escrowPda,
  amountLamports,
  onChainSignature,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  sellerWallet: string;
  escrowPda: string;
  amountLamports: number;
  onChainSignature?: string | null;
}): Promise<void> {
  console.log("[escrow-ledger] logEscrowShipped called", {
    auctionId,
    threadId: threadId ?? null,
    sellerWallet,
    escrowPda,
    amountLamports,
    onChainSignature: onChainSignature ?? null,
  });

  if (isBrowserLedgerWrite()) {
    await postEscrowLedgerEvent(
      {
        type: "shipped",
        auctionId,
        threadId,
        sellerWallet,
        escrowPda,
        amountLamports,
        onChainSignature,
      },
      sellerWallet
    );
    return;
  }

  const db = await getWriteClient();
  const fundedSplit = await getFundedEscrowSplit(auctionId, db);

  await insertEscrowTransaction({
    auctionId,
    auctionReferenceNumber,
    threadId,
    eventType: "shipped",
    direction: "outward",
    fromWallet: sellerWallet,
    toWallet: escrowPda,
    amountLamports,
    bidLamports: fundedSplit?.bidLamports ?? null,
    shippingLamports: fundedSplit?.shippingLamports ?? null,
    onChainSignature,
    escrowPda,
  });
}

async function persistEscrowReleased({
  auctionId,
  auctionReferenceNumber,
  threadId,
  sellerWallet,
  escrowPda,
  totalLamports,
  onChainSignature,
  platformWallet = PLATFORM_WALLET,
  bidLamports,
  shippingLamports,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  sellerWallet: string;
  escrowPda: string;
  totalLamports: number;
  onChainSignature: string;
  platformWallet?: string;
  bidLamports?: number | null;
  shippingLamports?: number | null;
}): Promise<void> {
  const db = await getWriteClient();
  const fundedSplit =
    bidLamports != null && shippingLamports != null
      ? { bidLamports, shippingLamports }
      : await getFundedEscrowSplit(auctionId, db);

  const resolvedBid = fundedSplit?.bidLamports ?? totalLamports;
  const resolvedShipping = fundedSplit?.shippingLamports ?? 0;
  const { sellerLamports, platformFeeLamports } = splitEscrowLamports(
    resolvedBid,
    resolvedShipping
  );

  await insertEscrowTransaction({
    auctionId,
    auctionReferenceNumber,
    threadId,
    eventType: "released",
    direction: "inward",
    fromWallet: escrowPda,
    toWallet: sellerWallet,
    amountLamports: sellerLamports,
    bidLamports: resolvedBid,
    shippingLamports: resolvedShipping,
    onChainSignature,
    escrowPda,
  });

  if (platformFeeLamports > 0) {
    await insertEscrowTransaction({
      auctionId,
      auctionReferenceNumber,
      threadId,
      eventType: "fee_collected",
      direction: "inward",
      fromWallet: escrowPda,
      toWallet: platformWallet,
      amountLamports: platformFeeLamports,
      bidLamports: resolvedBid,
      shippingLamports: resolvedShipping,
      isPlatformFee: true,
      onChainSignature,
      escrowPda,
    });
  }
}

export async function logEscrowReleased({
  auctionId,
  auctionReferenceNumber,
  threadId,
  sellerWallet,
  escrowPda,
  totalLamports,
  onChainSignature,
  platformWallet = PLATFORM_WALLET,
  buyerWallet,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  sellerWallet: string;
  escrowPda: string;
  totalLamports: number;
  onChainSignature: string;
  platformWallet?: string;
  buyerWallet: string;
}): Promise<void> {
  console.log("[escrow-ledger] logEscrowReleased called", {
    auctionId,
    threadId: threadId ?? null,
    sellerWallet,
    buyerWallet,
    escrowPda,
    totalLamports,
    onChainSignature,
  });

  if (isBrowserLedgerWrite()) {
    await postEscrowLedgerEvent(
      {
        type: "released",
        auctionId,
        threadId,
        sellerWallet,
        escrowPda,
        totalLamports,
        onChainSignature,
      },
      buyerWallet
    );
    return;
  }

  await persistEscrowReleased({
    auctionId,
    auctionReferenceNumber,
    threadId,
    sellerWallet,
    escrowPda,
    totalLamports,
    onChainSignature,
    platformWallet,
  });
}

export async function logEscrowRefunded({
  auctionId,
  auctionReferenceNumber,
  threadId,
  buyerWallet,
  escrowPda,
  amountLamports,
  onChainSignature,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  buyerWallet: string;
  escrowPda: string;
  amountLamports: number;
  onChainSignature: string;
}): Promise<void> {
  if (isBrowserLedgerWrite()) {
    await postEscrowLedgerEvent(
      {
        type: "refunded",
        auctionId,
        threadId,
        buyerWallet,
        escrowPda,
        amountLamports,
        onChainSignature,
      },
      buyerWallet
    );
    return;
  }

  await insertEscrowTransaction({
    auctionId,
    auctionReferenceNumber,
    threadId,
    eventType: "refunded",
    direction: "inward",
    fromWallet: escrowPda,
    toWallet: buyerWallet,
    amountLamports,
    onChainSignature,
    escrowPda,
  });
}

export async function logEscrowDisputeResolved({
  auctionId,
  auctionReferenceNumber,
  threadId,
  buyerWallet,
  sellerWallet,
  escrowPda,
  totalLamports,
  onChainSignature,
  releaseToSeller,
  platformWallet = PLATFORM_WALLET,
}: {
  auctionId: string;
  auctionReferenceNumber?: string | null;
  threadId?: string | null;
  buyerWallet: string;
  sellerWallet: string;
  escrowPda: string;
  totalLamports: number;
  onChainSignature: string;
  releaseToSeller: boolean;
  platformWallet?: string;
}): Promise<void> {
  if (isBrowserLedgerWrite()) {
    await postEscrowLedgerEvent(
      {
        type: "dispute_resolved",
        auctionId,
        threadId,
        buyerWallet,
        sellerWallet,
        escrowPda,
        totalLamports,
        onChainSignature,
        releaseToSeller,
      },
      releaseToSeller ? sellerWallet : buyerWallet
    );
    return;
  }

  if (releaseToSeller) {
    await persistEscrowReleased({
      auctionId,
      auctionReferenceNumber,
      threadId,
      sellerWallet,
      escrowPda,
      totalLamports,
      onChainSignature,
      platformWallet,
    });
  } else {
    await logEscrowRefunded({
      auctionId,
      auctionReferenceNumber,
      threadId,
      buyerWallet,
      escrowPda,
      amountLamports: totalLamports,
      onChainSignature,
    });
  }

  await insertEscrowTransaction({
    auctionId,
    auctionReferenceNumber,
    threadId,
    eventType: "dispute_resolved",
    direction: "inward",
    fromWallet: escrowPda,
    toWallet: releaseToSeller ? sellerWallet : buyerWallet,
    amountLamports: totalLamports,
    onChainSignature,
    escrowPda,
  });
}

export function directionForWallet(
  row: EscrowTransaction,
  wallet: string
): EscrowLedgerDirection {
  const normalizedWallet = wallet.trim();
  const fromWallet = row.from_wallet.trim();
  const toWallet = row.to_wallet.trim();
  if (toWallet === normalizedWallet) return "inward";
  if (fromWallet === normalizedWallet) return "outward";
  return row.direction;
}

const AUCTION_LEDGER_COLUMNS =
  "id, title, reference_number, seller_wallet, category, escrow_state, shipping_status, tracking_number, tracking_courier, payment_completed_at, is_dummy, escrow_tx_signature, sol_usd_rate_at_payment, domestic_shipping_usd, listing_type, purchase_type";

async function attachAuctionsAndBuyers(
  rows: EscrowTransaction[],
  client: SupabaseClient
): Promise<EscrowTransactionWithAuction[]> {
  if (!rows.length) return [];

  const auctionIds = [...new Set(rows.map((row) => row.auction_id))];
  const [{ data: auctionRows, error: auctionError }, { data: bidRows, error: bidError }] =
    await Promise.all([
      client.from("auctions").select(AUCTION_LEDGER_COLUMNS).in("id", auctionIds),
      client
        .from("bids")
        .select("auction_id, bidder_wallet, amount")
        .in("auction_id", auctionIds)
        .order("amount", { ascending: false }),
    ]);

  if (auctionError) throw auctionError;
  if (bidError) throw bidError;

  const auctions = new Map(
    (auctionRows ?? []).map((row) => [
      row.id as string,
      parseAuctionRow(row as Record<string, unknown>),
    ])
  );

  const topBidders = new Map<string, string>();
  for (const row of bidRows ?? []) {
    const auctionId = row.auction_id as string;
    if (!topBidders.has(auctionId)) {
      topBidders.set(auctionId, row.bidder_wallet as string);
    }
  }

  const enriched: EscrowTransactionWithAuction[] = [];
  for (const row of rows) {
    const auction = auctions.get(row.auction_id);
    if (!auction) continue;
    enriched.push({
      ...row,
      auction,
      buyer_wallet: topBidders.get(row.auction_id) ?? null,
    });
  }
  return enriched;
}

export async function fetchWalletLedgerEvents(
  wallet: string,
  client: SupabaseClient = getLedgerReadClient(wallet)
): Promise<EscrowTransactionWithAuction[]> {
  const normalizedWallet = wallet.trim();
  const { data, error } = await client
    .from("escrow_transactions")
    .select(LEDGER_COLUMNS)
    .or(walletLedgerFilter(normalizedWallet))
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? [])
    .map((row) => parseLedgerRow(row as Record<string, unknown>))
    .filter(
      (row) =>
        row.from_wallet === normalizedWallet || row.to_wallet === normalizedWallet
    );

  return attachAuctionsAndBuyers(rows, client);
}

export async function fetchSellerLedgerEvents(
  sellerWallet: string,
  client: SupabaseClient = getLedgerReadClient(sellerWallet)
): Promise<EscrowTransactionWithAuction[]> {
  return fetchWalletLedgerEvents(sellerWallet, client);
}

export async function fetchBuyerLedgerEvents(
  buyerWallet: string,
  client: SupabaseClient = getLedgerReadClient(buyerWallet)
): Promise<EscrowTransactionWithAuction[]> {
  return fetchWalletLedgerEvents(buyerWallet, client);
}

export async function fetchAllLedgerEvents(
  client: SupabaseClient = getNotificationClient()
): Promise<EscrowTransactionWithAuction[]> {
  const { data, error } = await client
    .from("escrow_transactions")
    .select(LEDGER_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return attachAuctionsAndBuyers(
    (data ?? []).map((row) => parseLedgerRow(row as Record<string, unknown>)),
    client
  );
}

export function latestLedgerStateByAuction(
  rows: EscrowTransactionWithAuction[]
): Map<string, EscrowLedgerEventType> {
  const latest = new Map<string, EscrowTransactionWithAuction>();

  for (const row of rows) {
    const existing = latest.get(row.auction_id);
    if (
      !existing ||
      new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()
    ) {
      latest.set(row.auction_id, row);
    }
  }

  const states = new Map<string, EscrowLedgerEventType>();
  for (const [auctionId, row] of latest) {
    states.set(auctionId, row.event_type);
  }
  return states;
}

export function auctionHasReleasedEvent(
  rows: EscrowTransaction[],
  auctionId: string
): boolean {
  return rows.some(
    (row) =>
      row.auction_id === auctionId &&
      (row.event_type === "released" || row.event_type === "fee_collected")
  );
}

export function mapLedgerEventToEscrowState(
  eventType: EscrowLedgerEventType
): EscrowState {
  switch (eventType) {
    case "funded":
      return "funded";
    case "shipped":
      return "shipped";
    case "released":
    case "fee_collected":
      return "complete";
    case "refunded":
      return "refunded";
    case "disputed":
      return "disputed";
    case "dispute_resolved":
      return "complete";
    default:
      return "funded";
  }
}

export function computePlatformFeeTotalSol(
  rows: EscrowTransaction[]
): number {
  return rows
    .filter((row) => row.is_platform_fee)
    .reduce((sum, row) => sum + lamportsToSol(row.amount_lamports), 0);
}
