import type { EscrowLedgerEventType } from "@/lib/escrow-ledger";

/** Shipped ledger events record on-chain confirmation only — no SOL transfer. */
export function isShippedLedgerEvent(
  eventType: EscrowLedgerEventType | string
): boolean {
  return eventType === "shipped";
}

export const SHIPPED_EVENT_SUBTITLE = "On-chain confirmation";
