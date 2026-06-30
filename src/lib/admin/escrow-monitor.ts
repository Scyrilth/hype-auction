import type { EscrowLedgerEventType } from "@/lib/escrow-ledger";

import type { EscrowMonitorRow, EscrowSummaryPill } from "./types";

const TERMINAL_FLOW_STATES = new Set([
  "complete",
  "released",
  "refunded",
  "cancelled",
  "expired",
]);

const TERMINAL_EVENT_TYPES = new Set<EscrowLedgerEventType>([
  "released",
  "fee_collected",
  "refunded",
  "dispute_resolved",
]);

const PILL_DEFS: {
  key: string;
  label: string;
  eventTypes: EscrowLedgerEventType[];
}[] = [
  { key: "funded", label: "Funded", eventTypes: ["funded"] },
  { key: "shipped", label: "Shipped", eventTypes: ["shipped"] },
  { key: "disputed", label: "Disputed", eventTypes: ["disputed"] },
  { key: "flagged", label: "Flagged", eventTypes: [] },
  { key: "released", label: "Released", eventTypes: ["released"] },
  { key: "fees", label: "Fees", eventTypes: ["fee_collected"] },
  { key: "refunded", label: "Refunded", eventTypes: ["refunded"] },
];

/** Disable escrow admin actions for terminal auction flow states and ledger legs. */
export function isEscrowMonitorActionsDisabled(row: EscrowMonitorRow): boolean {
  const flow = row.auctionEscrowState?.trim().toLowerCase() ?? "none";
  if (TERMINAL_FLOW_STATES.has(flow)) return true;
  return TERMINAL_EVENT_TYPES.has(row.eventType as EscrowLedgerEventType);
}

export function computeEscrowMonitorPills(rows: EscrowMonitorRow[]): EscrowSummaryPill[] {
  return PILL_DEFS.map(({ key, label, eventTypes }) => {
    const matching =
      key === "flagged"
        ? rows.filter((row) => row.isFlagged && row.eventType === "funded")
        : rows.filter((row) =>
            eventTypes.includes(row.eventType as EscrowLedgerEventType)
          );

    return {
      key,
      label,
      count: matching.length,
      totalSol: matching.reduce((sum, row) => sum + row.amountSol, 0),
    };
  });
}

export function computeEscrowMonitorVolumeSol(rows: EscrowMonitorRow[]): number {
  return rows
    .filter((row) => row.eventType === "funded")
    .reduce((sum, row) => sum + row.amountSol, 0);
}

export function computeEscrowMonitorFeesSol(rows: EscrowMonitorRow[]): number {
  return rows
    .filter((row) => row.eventType === "fee_collected")
    .reduce((sum, row) => sum + row.amountSol, 0);
}

export function escrowMonitorRowMatchesSearch(
  row: EscrowMonitorRow,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    row.platformTransactionId.toLowerCase().includes(q) ||
    (row.reference?.toLowerCase().includes(q) ?? false) ||
    row.fromWallet.toLowerCase().includes(q) ||
    row.toWallet.toLowerCase().includes(q)
  );
}

export function historicalUsdAtPayment(
  amountSol: number,
  solUsdRateAtPayment: number | null
): number | null {
  if (
    solUsdRateAtPayment == null ||
    !Number.isFinite(solUsdRateAtPayment) ||
    solUsdRateAtPayment <= 0
  ) {
    return null;
  }
  return amountSol * solUsdRateAtPayment;
}
