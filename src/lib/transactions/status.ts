import type { EscrowState } from "@/lib/database.types";
import type {
  BuyerDisplayStatus,
  SellerDisplayStatus,
} from "./types";

/** Escrow states that represent a transaction row in seller/buyer history. */
export const TRANSACTION_ESCROW_STATES: EscrowState[] = [
  "released",
  "complete",
  "funded",
  "shipped",
  "pending",
  "refunded",
  "disputed",
];

export function isTransactionEscrowState(state: EscrowState): boolean {
  return TRANSACTION_ESCROW_STATES.includes(state);
}

export function mapSellerDisplayStatus(
  escrowState: EscrowState
): SellerDisplayStatus | null {
  switch (escrowState) {
    case "released":
    case "complete":
      return "released";
    case "funded":
    case "shipped":
    case "pending":
      return "funded";
    case "refunded":
      return "refunded";
    case "disputed":
      return "disputed";
    default:
      return null;
  }
}

export function mapBuyerDisplayStatus(
  escrowState: EscrowState
): BuyerDisplayStatus | null {
  switch (escrowState) {
    case "released":
    case "complete":
      return "completed";
    case "funded":
    case "shipped":
    case "pending":
      return "pending";
    case "refunded":
      return "refunded";
    default:
      return null;
  }
}

/** Prefer auction lifecycle when a ledger leg predates terminal escrow_state. */
export function resolveDisplayEscrowState(
  eventEscrowState: EscrowState,
  auctionEscrowState: EscrowState
): EscrowState {
  if (eventEscrowState === "refunded" || eventEscrowState === "disputed") {
    return eventEscrowState;
  }
  if (eventEscrowState === "complete" || eventEscrowState === "released") {
    return eventEscrowState;
  }
  if (auctionEscrowState === "refunded") return "refunded";
  if (auctionEscrowState === "complete" || auctionEscrowState === "released") {
    return "complete";
  }
  return eventEscrowState;
}

export const SELLER_STATUS_LABELS: Record<SellerDisplayStatus, string> = {
  released: "Released",
  funded: "Funded",
  refunded: "Refunded",
  disputed: "Disputed",
};

export const BUYER_STATUS_LABELS: Record<BuyerDisplayStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  refunded: "Refunded",
};

export function sellerStatusBadgeClass(status: SellerDisplayStatus): string {
  switch (status) {
    case "released":
      return "bg-emerald-500/15 text-emerald-300";
    case "funded":
      return "bg-accent/15 text-purple-300";
    case "refunded":
      return "bg-amber-500/15 text-amber-300";
    case "disputed":
      return "bg-red-500/15 text-red-300";
  }
}

export function buyerStatusBadgeClass(status: BuyerDisplayStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300";
    case "pending":
      return "bg-accent/15 text-purple-300";
    case "refunded":
      return "bg-amber-500/15 text-amber-300";
  }
}
