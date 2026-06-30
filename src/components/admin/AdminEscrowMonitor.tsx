"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { adminTabClass } from "@/components/admin/admin-tab-styles";
import { adminActionButtonClass } from "@/components/admin/admin-button-styles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DateRangeSelector from "@/components/transactions/DateRangeSelector";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { getErrorMessage } from "@/lib/errors";
import {
  computeEscrowMonitorFeesSol,
  computeEscrowMonitorPills,
  computeEscrowMonitorVolumeSol,
  isEscrowMonitorActionsDisabled,
} from "@/lib/admin/escrow-monitor";
import type {
  EscrowMonitorRow,
  EscrowStateCount,
} from "@/lib/admin/types";
import { shortenAddress } from "@/lib/format";
import {
  getDateRangeFromPreset,
  isDateInRange,
  isShippedLedgerEvent,
  SHIPPED_EVENT_SUBTITLE,
  type DateRange,
} from "@/lib/transactions";

import { useAdminContext } from "./AdminContext";

function ageClass(days: number) {
  if (days >= 7) return "text-red-400";
  if (days >= 4) return "text-amber-400";
  return "text-emerald-400";
}

function badgeClass(state: string) {
  switch (state) {
    case "released":
    case "complete":
    case "Released":
    case "Fee Collected":
      return "bg-emerald-500/15 text-emerald-300";
    case "disputed":
    case "Disputed":
      return "bg-red-500/15 text-red-300";
    case "refunded":
    case "Refunded":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-accent/15 text-purple-300";
  }
}

function flowDirectionClass(direction: "INWARD" | "OUTWARD") {
  return direction === "INWARD" ? "text-emerald-400" : "text-red-400";
}

function DisabledActionButton({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof adminActionButtonClass;
}) {
  return (
    <span
      className={`${adminActionButtonClass[variant]} admin-action-btn--disabled`}
      aria-disabled="true"
    >
      {label}
    </span>
  );
}

export default function AdminEscrowMonitor() {
  const { publicKey } = useWallet();
  const { showDummyData } = useAdminContext();
  const { showToast } = useToast();
  const { releaseToSeller, refundToBuyer, loading: actionLoading } = useAdminEscrow();
  const [rows, setRows] = useState<EscrowMonitorRow[]>([]);
  const [stateCounts, setStateCounts] = useState<EscrowStateCount[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset("all")
  );
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{
    type: "release" | "refund";
    row: EscrowMonitorRow;
  } | null>(null);

  const load = useCallback(async () => {
    const wallet = publicKey?.toBase58();
    if (!wallet) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/escrow-monitor?showDummyData=${showDummyData ? "true" : "false"}`,
        {
          headers: {
            "x-wallet-address": wallet,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to load escrow monitor");
      }
      const data = (await response.json()) as {
        rows: EscrowMonitorRow[];
        stateCounts: EscrowStateCount[];
      };
      setRows(data.rows);
      setStateCounts(data.stateCounts);
    } finally {
      setLoading(false);
    }
  }, [publicKey, showDummyData]);

  useEffect(() => {
    void load();
  }, [load]);

  const dateFilteredRows = useMemo(
    () => rows.filter((row) => isDateInRange(row.createdAt, dateRange)),
    [rows, dateRange]
  );

  const pills = useMemo(
    () => computeEscrowMonitorPills(dateFilteredRows),
    [dateFilteredRows]
  );

  const totalVolumeSol = useMemo(
    () => computeEscrowMonitorVolumeSol(dateFilteredRows),
    [dateFilteredRows]
  );

  const platformFeesSol = useMemo(
    () => computeEscrowMonitorFeesSol(dateFilteredRows),
    [dateFilteredRows]
  );

  const filtered = useMemo(() => {
    let list = [...dateFilteredRows];
    if (filter !== "all") {
      if (filter === "flagged") list = list.filter((r) => r.isFlagged);
      else if (filter === "funded") list = list.filter((r) => r.eventType === "funded");
      else if (filter === "shipped") list = list.filter((r) => r.eventType === "shipped");
      else if (filter === "disputed") list = list.filter((r) => r.eventType === "disputed");
      else if (filter === "released")
        list = list.filter((r) => r.eventType === "released");
      else if (filter === "fees")
        list = list.filter((r) => r.eventType === "fee_collected");
      else if (filter === "refunded") list = list.filter((r) => r.eventType === "refunded");
      else list = list.filter((r) => r.auctionEscrowState === filter);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [dateFilteredRows, filter]);

  const handleConfirm = async () => {
    if (!dialog) return;
    const { row, type } = dialog;
    const result =
      type === "release"
        ? await releaseToSeller(
            row.auctionId,
            row.auctionEscrowState,
            row.sellerWallet,
            row.buyerWallet
          )
        : await refundToBuyer(
            row.auctionId,
            row.buyerWallet,
            row.sellerWallet,
            row.auctionEscrowState
          );
    if (result.success) {
      showToast("Escrow action completed.");
      setDialog(null);
      void load();
    } else {
      showToast(getErrorMessage(result.error), "error");
    }
  };

  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-surface" />;

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
            Total escrow volume
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {totalVolumeSol.toFixed(4)} SOL
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
            Platform fees collected
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {platformFeesSol.toFixed(4)} SOL
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 sm:col-span-2 lg:col-span-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
            Auctions by escrow state
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stateCounts.length === 0 ? (
              <span className="text-xs text-muted">No escrow activity</span>
            ) : (
              stateCounts.map((entry) => (
                <span
                  key={entry.state}
                  className="rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  <span className="capitalize">{entry.state}</span>
                  <span className="ml-1 font-semibold text-white">{entry.count}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <DateRangeSelector
        range={dateRange}
        onChange={setDateRange}
        embedded
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={adminTabClass(filter === "all")}
        >
          All
        </button>
        {pills.map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => setFilter(pill.key)}
            className={adminTabClass(filter === pill.key)}
          >
            {pill.label}: {pill.count} ({pill.totalSol.toFixed(2)} SOL)
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-3 py-2">Txn ID</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Leg</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Flow</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Tx</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const actionsDisabled = isEscrowMonitorActionsDisabled(row);

              return (
                <tr key={row.ledgerId} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <p className="font-mono text-purple-300">{row.platformTransactionId}</p>
                    {row.reference ? (
                      <p className="mt-0.5 font-mono text-[10px] text-muted">{row.reference}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/auction/${row.auctionId}`}
                      className="text-white hover:text-accent"
                    >
                      {row.itemTitle}
                    </Link>
                    <p className="text-muted">
                      {shortenAddress(row.fromWallet, 3)} → {shortenAddress(row.toWallet, 3)}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 ${badgeClass(row.eventLabel)}`}
                    >
                      {row.eventLabel}
                    </span>
                    {row.isPlatformFee ? (
                      <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Fee
                      </span>
                    ) : null}
                    {isShippedLedgerEvent(row.eventType) ? (
                      <p
                        className="mt-0.5 text-[10px] text-muted"
                        title="No funds transferred; records shipment on-chain"
                      >
                        {SHIPPED_EVENT_SUBTITLE}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${flowDirectionClass(row.escrowFlowDirection)}`}
                    >
                      {row.escrowFlowDirection}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {isShippedLedgerEvent(row.eventType) ? (
                      <span className="text-muted">—</span>
                    ) : (
                      `${row.amountSol.toFixed(4)} SOL`
                    )}
                  </td>
                  <td className="px-3 py-2 capitalize text-muted">{row.auctionEscrowState}</td>
                  <td className={`px-3 py-2 font-medium ${ageClass(row.daysInState)}`}>
                    {row.daysInState}d
                  </td>
                  <td className="px-3 py-2 text-muted">{row.trackingStatus}</td>
                  <td className="px-3 py-2">
                    {row.solscanUrl ? (
                      <a
                        href={row.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-purple-300 hover:text-accent"
                      >
                        Solscan
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className={`flex flex-wrap gap-1 ${
                        actionsDisabled ? "pointer-events-none" : ""
                      }`}
                    >
                      {row.threadId ? (
                        actionsDisabled ? (
                          <DisabledActionButton label="Thread" variant="thread" />
                        ) : (
                          <Link
                            href={`/messages/${row.threadId}`}
                            target="_blank"
                            className={adminActionButtonClass.thread}
                          >
                            Thread
                          </Link>
                        )
                      ) : null}
                      {actionsDisabled ? (
                        <>
                          <DisabledActionButton label="Release" variant="release" />
                          <DisabledActionButton label="Refund" variant="refund" />
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setDialog({ type: "release", row })}
                            className={adminActionButtonClass.release}
                          >
                            Release
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialog({ type: "refund", row })}
                            className={adminActionButtonClass.refund}
                          >
                            Refund
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.type === "release" ? "Release escrow" : "Refund escrow"}
        message={`${dialog?.type === "release" ? "Release" : "Refund"} ${dialog?.row.amountSol.toFixed(4)} SOL? This cannot be undone.`}
        confirmLabel="Confirm"
        confirmClassName={
          dialog?.type === "release"
            ? "bg-emerald-600 hover:bg-emerald-500"
            : "bg-amber-600 hover:bg-amber-500"
        }
        loading={actionLoading}
        onCancel={() => setDialog(null)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
