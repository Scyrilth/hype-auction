import type { EscrowState, User } from "@/lib/database.types";

export type AdminTab =
  | "overview"
  | "flagged"
  | "disputes"
  | "escrow"
  | "users";

export interface AdminOverviewStats {
  totalGmvSol: number;
  activeListings: number;
  totalUsers: number;
  disputeRate: number;
}

export interface AdminGmvMonth {
  label: string;
  valueSol: number;
}

export interface AdminUsersMonth {
  label: string;
  count: number;
}

export interface AdminCategoryGmv {
  category: string;
  valueSol: number;
  percent: number;
}

export interface AdminStatusCount {
  status: string;
  count: number;
}

export interface AdminVendorRow {
  wallet: string;
  username: string | null;
  salesCount: number;
  volumeSol: number;
  avgSaleSol: number;
  disputeRate: number;
}

export interface AdminCategoryRow {
  category: string;
  listingCount: number;
  volumeSol: number;
  avgSaleSol: number;
}

export interface FlaggedOrder {
  auctionId: string;
  reference: string | null;
  itemTitle: string;
  sellerWallet: string;
  buyerWallet: string;
  paymentDate: string;
  daysSincePayment: number;
  estDeliveryDate: string | null;
  graceLabel: string;
  graceExpiresAt: string;
  amountSol: number;
  isInternational: boolean;
  escrowState: EscrowState;
}

export interface AdminLiveAuctionRow {
  auctionId: string;
  itemTitle: string;
  sellerWallet: string;
  currentBidSol: number;
  bidCount: number;
  endTime: string;
}

export interface EarlyEndedAuctionRow {
  auctionId: string;
  itemTitle: string;
  sellerWallet: string;
  earlyEndReason: string;
  earlyEndAt: string;
  highestBidSol: number;
  buyerWallet: string;
}

export interface DisputeRow {
  auctionId: string;
  reference: string | null;
  itemTitle: string;
  sellerWallet: string;
  buyerWallet: string;
  sellerUsername: string | null;
  openedAt: string;
  daysOpen: number;
  amountSol: number;
  usdApprox: number;
  description: string | null;
  imageUrl: string | null;
  additionalImages: string[];
  threadId: string | null;
  resolved: boolean;
  outcome: "seller" | "buyer" | null;
}

export interface EscrowMonitorRow {
  ledgerId: string;
  auctionId: string;
  platformTransactionId: string;
  reference: string | null;
  itemTitle: string;
  sellerWallet: string;
  buyerWallet: string;
  fromWallet: string;
  toWallet: string;
  amountSol: number;
  paymentDate: string | null;
  createdAt: string;
  /** Leg label for this ledger row (funded, released, etc.). */
  eventType: string;
  eventLabel: string;
  /** Escrow-relative flow for display (into vs out of escrow). */
  escrowFlowDirection: "INWARD" | "OUTWARD";
  /** Auction-level escrow state (for terminal action gating). */
  auctionEscrowState: EscrowState;
  daysInState: number;
  trackingStatus: string;
  threadId: string | null;
  isDummy: boolean;
  isFlagged: boolean;
  isPlatformFee: boolean;
  isTerminal: boolean;
  onChainSignature: string | null;
  solscanUrl: string | null;
  /** SOL/USD rate stored on the auction at payment time (historical row USD). */
  solUsdRateAtPayment: number | null;
  bidSol: number | null;
  shippingSol: number | null;
}

export interface EscrowStateCount {
  state: string;
  count: number;
}

export interface EscrowMonitorData {
  rows: EscrowMonitorRow[];
  pills: EscrowSummaryPill[];
  platformFeesSol: number;
  totalVolumeSol: number;
  stateCounts: EscrowStateCount[];
}

export interface EscrowSummaryPill {
  key: string;
  label: string;
  count: number;
  totalSol: number;
}

export interface AdminUserProfile extends User {
  listingsCount: number;
  salesCount: number;
  purchasesCount: number;
  reviewsCount: number;
  strikeCount: number;
  status: "active" | "warned" | "suspended" | "banned";
}

export interface BuyerStrikeRow {
  id: string;
  wallet_address: string;
  auction_id: string | null;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

export interface RecentUserRow {
  wallet: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  strikeCount: number;
  status: AdminUserProfile["status"];
}
