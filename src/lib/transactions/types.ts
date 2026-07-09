import type { EscrowState, ListingType, PurchaseType } from "@/lib/database.types";
import type { EscrowLedgerDirection, EscrowLedgerEventType } from "@/lib/escrow-ledger";

export type TransactionRole = "selling" | "buying";

export type DateRangePreset =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "all";

export type ChartGranularity = "hour" | "day" | "week" | "month" | "quarter";

export type SellerDisplayStatus = "released" | "funded" | "refunded" | "disputed";

export type BuyerDisplayStatus = "completed" | "pending" | "refunded";

export type SellerStatusFilter = "all" | SellerDisplayStatus;

export type BuyerStatusFilter = "all" | BuyerDisplayStatus;

export interface DateRange {
  preset: DateRangePreset;
  from: Date;
  to: Date;
  label: string;
  isCustom?: boolean;
}

export interface TransactionAmounts {
  itemSol: number;
  shippingSol: number;
  shippingUsd: number;
  feeSol: number;
  netSol: number;
  totalSol: number;
  usdApprox: number;
  usdRateUsed: number;
  usesHistoricalRate: boolean;
}

export interface TransactionRateInfo {
  solUsdRateAtPayment: number | null;
  paymentCompletedAt: string | null;
  usdRateUsed: number;
  usesHistoricalRate: boolean;
}

export interface SellerTransactionRow {
  role: "selling";
  auctionId: string;
  reference: string | null;
  itemTitle: string;
  buyerWallet: string;
  date: string;
  amounts: TransactionAmounts;
  escrowState: EscrowState;
  displayStatus: SellerDisplayStatus;
  txSignature: string | null;
  solscanUrl: string | null;
  direction: EscrowLedgerDirection;
  eventType: EscrowLedgerEventType;
  platformTransactionId: string;
  category: string | null;
  solUsdRateAtPayment: number | null;
  paymentCompletedAt: string | null;
  purchaseType: PurchaseType;
  listingType: ListingType;
}

export interface BuyerTransactionRow {
  role: "buying";
  auctionId: string;
  reference: string | null;
  itemTitle: string;
  sellerWallet: string;
  fromWallet: string;
  date: string;
  amounts: TransactionAmounts;
  escrowState: EscrowState;
  displayStatus: BuyerDisplayStatus;
  txSignature: string | null;
  solscanUrl: string | null;
  direction: EscrowLedgerDirection;
  eventType: EscrowLedgerEventType;
  platformTransactionId: string;
  category: string | null;
  solUsdRateAtPayment: number | null;
  paymentCompletedAt: string | null;
  purchaseType: PurchaseType;
  listingType: ListingType;
}

export type TransactionRow = SellerTransactionRow | BuyerTransactionRow;

export interface TrendMetric {
  current: number;
  previous: number;
  percentChange: number | null;
  direction: "up" | "down" | "flat";
}

export interface SellerSummary {
  totalEarned: TrendMetric;
  pendingEscrow: TrendMetric;
  platformFees: TrendMetric;
  totalRefunded: TrendMetric;
  pendingOrderCount: number;
}

export interface BuyerSummary {
  totalSpent: TrendMetric;
  pending: TrendMetric;
  totalRefunded: TrendMetric;
  purchasesCompleted: TrendMetric;
  pendingOrderCount: number;
}

export interface TimeSeriesPoint {
  label: string;
  timestamp: number;
  value: number;
  count: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  valueSol: number;
  count: number;
  percent: number;
}

export interface StatusBreakdownPoint {
  status: string;
  count: number;
  valueSol: number;
}

export interface SellerInsights {
  averageSalePrice: number;
  disputeRate: number;
  bestListing: { title: string; totalSol: number; auctionId: string } | null;
}

export interface TransactionsData {
  sellerRows: SellerTransactionRow[];
  buyerRows: BuyerTransactionRow[];
  hasSellerListings: boolean;
}

export type SortDirection = "asc" | "desc";

export type SellerSortKey =
  | "platformTransactionId"
  | "itemTitle"
  | "buyerWallet"
  | "date"
  | "amountSol"
  | "displayStatus";

export type BuyerSortKey =
  | "platformTransactionId"
  | "itemTitle"
  | "sellerWallet"
  | "date"
  | "amountSol"
  | "displayStatus";
