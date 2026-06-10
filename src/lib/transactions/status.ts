import type { EscrowState } from "@/lib/database.types";
import type {
  BuyerDisplayStatus,
  SellerDisplayStatus,
} from "./types";

export function mapSellerDisplayStatus(
  escrowState: EscrowState
): SellerDisplayStatus | null {
  switch (escrowState) {
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
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "funded":
      return "bg-accent/15 text-purple-300 border-accent/30";
    case "refunded":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "disputed":
      return "bg-live-red/15 text-red-300 border-live-red/30";
  }
}

export function buyerStatusBadgeClass(status: BuyerDisplayStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "pending":
      return "bg-accent/15 text-purple-300 border-accent/30";
    case "refunded":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }
}
