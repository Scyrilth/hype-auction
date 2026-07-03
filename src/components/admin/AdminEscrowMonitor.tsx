"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { adminTabClass } from "@/components/admin/admin-tab-styles";
import { adminActionButtonClass } from "@/components/admin/admin-button-styles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AdminDateRangeFilter from "@/components/admin/AdminDateRangeFilter";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { useSolPrice } from "@/hooks/useSolPrice";
import { getErrorMessage } from "@/lib/errors";
import {
  computeEscrowMonitorFeesSol,
  computeEscrowMonitorPills,
  computeEscrowMonitorVolumeSol,
  escrowMonitorRowMatchesSearch,
  historicalUsdAtPayment,
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

function CopyableWalletAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="font-mono text-muted transition-colors hover:text-white"
      title={copied ? "Copied!" : `Copy ${address}`}
    >
      {shortenAddress(address, 3)}
      {copied ? (
        <span className="ml-1 text-[10px] font-medium text-emerald-400">Copied!</span>
      ) : null}
    </button>
  );
}

function EscrowActionButton({
  label,
  variant,
  disabled = false,
  onClick,
  href,
}: {
  label: string;
  variant: keyof typeof adminActionButtonClass;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const className = `${adminActionButtonClass[variant]}${disabled ? " admin-action-btn--disabled" : ""}`;

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {label}
      </span>
    );
  }

  if (href) {
    return (
      <Link href={href} target="_blank" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function EscrowAmountCell({ row }: { row: EscrowMonitorRow }) {
  if (isShippedLedgerEvent(row.eventType)) {
    return <span className="text-muted">—</span>;
  }

  const usd = historicalUsdAtPayment(row.amountSol, row.solUsdRateAtPayment);
  const showBreakdown =
    row.eventType === "funded" &&
    row.bidSol != null &&
    row.bidSol > 0 &&
    row.shippingSol != null &&
    row.shippingSol > 0;

  return (
    <span className="whitespace-nowrap text-[11px]">
      {row.amountSol.toFixed(4)} SOL
      {showBreakdown ? (
        <span className="mt-0.5 block text-[10px] font-normal text-muted">
          {row.bidSol!.toFixed(4)} SOL bid + {row.shippingSol!.toFixed(4)} SOL
          shipping
        </span>
      ) : null}
      {usd != null ? (
        <span
          className="ml-1 text-[10px] text-muted"
          title={`~$${usd.toFixed(2)} at time of payment`}
        >
          ~${usd.toFixed(2)}
        </span>
      ) : null}
    </span>
  );
}

function SummaryMetric({
  label,
  amountSol,
  solPrice,
  valueClassName = "text-white",
}: {
  label: string;
  amountSol: number;
  solPrice: number | null;
  valueClassName?: string;
}) {
  const usd =
    solPrice != null && Number.isFinite(solPrice) && solPrice > 0
      ? amountSol * solPrice
      : null;

  return (
    <div className="rounded border border-border bg-surface px-2.5 py-1.5">
      <p className="text-[9px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold leading-none ${valueClassName}`}>
        {amountSol.toFixed(4)} SOL
        {usd != null ? (
          <span className="ml-1.5 text-[10px] font-normal text-muted">
            ~${usd.toFixed(2)}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export default function AdminEscrowMonitor() {
  const { publicKey } = useWallet();
  const { showDummyData } = useAdminContext();
  const { showToast } = useToast();
  const { solPrice } = useSolPrice();
  const { releaseToSeller, refundToBuyer, loading: actionLoading } = useAdminEscrow();
  const [rows, setRows] = useState<EscrowMonitorRow[]>([]);
  const [stateCounts, setStateCounts] = useState<EscrowStateCount[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset("all")
  );
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    return list
      .filter((row) => escrowMonitorRowMatchesSearch(row, searchQuery))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [dateFilteredRows, filter, searchQuery]);

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

  if (loading) return <div className="admin-escrow-monitor h-20 animate-pulse rounded-lg bg-surface" />;

  return (
    <div className="admin-escrow-monitor space-y-1.5">
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric
          label="Total escrow volume"
          amountSol={totalVolumeSol}
          solPrice={solPrice}
        />
        <SummaryMetric
          label="Platform fees collected"
          amountSol={platformFeesSol}
          solPrice={solPrice}
          valueClassName="text-emerald-300"
        />
        <div className="rounded border border-border bg-surface px-2.5 py-1.5 sm:col-span-2 lg:col-span-2">
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted">
            Auctions by escrow state
          </p>
          <div className="mt-0.5 flex flex-wrap gap-0.5">
            {stateCounts.length === 0 ? (
              <span className="text-[10px] text-muted">No escrow activity</span>
            ) : (
              stateCounts.map((entry) => (
                <span
                  key={entry.state}
                  className="rounded-full border border-border bg-surface-elevated px-1.5 py-px text-[9px] text-zinc-300"
                >
                  <span className="capitalize">{entry.state}</span>
                  <span className="ml-0.5 font-semibold text-white">{entry.count}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
        <AdminDateRangeFilter range={dateRange} onChange={setDateRange} />
        <div className="relative w-full lg:max-w-xs lg:shrink-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search txn ID, ref, wallet..."
            className="w-full rounded border border-border bg-surface-elevated py-1 pl-2 pr-7 text-[11px] text-white placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 text-xs text-muted hover:text-white"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
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

      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full min-w-[960px] text-left text-[11px]">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="font-medium">Txn ID</th>
              <th className="font-medium">Item</th>
              <th className="font-medium">Leg</th>
              <th className="font-medium">Dir</th>
              <th className="font-medium">Amount</th>
              <th className="font-medium">Flow</th>
              <th className="font-medium">Days</th>
              <th className="font-medium">Tracking</th>
              <th className="font-medium">Tx</th>
              <th className="whitespace-nowrap font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-2 py-4 text-center text-[11px] text-muted">
                  No transactions match your filters
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const actionsDisabled = isEscrowMonitorActionsDisabled(row);
                const legTitle = isShippedLedgerEvent(row.eventType)
                  ? SHIPPED_EVENT_SUBTITLE
                  : undefined;

                return (
                  <tr key={row.ledgerId} className="border-t border-border/60">
                    <td className="max-w-[140px] align-top">
                      <p
                        className="break-all font-mono text-[10px] leading-tight text-purple-300"
                        title={row.platformTransactionId}
                      >
                        {row.platformTransactionId}
                      </p>
                      {row.reference ? (
                        <p
                          className="mt-0.5 break-all font-mono text-[9px] leading-tight text-muted"
                          title={row.reference}
                        >
                          {row.reference}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] align-top">
                      <Link
                        href={`/auction/${row.auctionId}`}
                        className="line-clamp-2 block leading-tight text-white hover:text-accent"
                        title={row.itemTitle}
                      >
                        {row.itemTitle}
                      </Link>
                      <p className="mt-0.5 whitespace-nowrap text-[10px] leading-tight text-muted">
                        <CopyableWalletAddress address={row.fromWallet} />
                        <span className="mx-1">→</span>
                        <CopyableWalletAddress address={row.toWallet} />
                      </p>
                    </td>
                    <td className="align-top" title={legTitle}>
                      <span className="inline-flex max-w-[110px] items-center gap-0.5 whitespace-nowrap">
                        <span
                          className={`rounded-full px-1.5 py-px text-[10px] ${badgeClass(row.eventLabel)}`}
                        >
                          {row.eventLabel}
                        </span>
                        {row.isPlatformFee ? (
                          <span className="rounded-full bg-amber-500/15 px-1 py-px text-[9px] text-amber-300">
                            Fee
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`text-[9px] font-semibold uppercase ${flowDirectionClass(row.escrowFlowDirection)}`}
                      >
                        {row.escrowFlowDirection === "INWARD" ? "IN" : "OUT"}
                      </span>
                    </td>
                    <td>
                      <EscrowAmountCell row={row} />
                    </td>
                    <td className="capitalize text-muted">{row.auctionEscrowState}</td>
                    <td className={`font-medium ${ageClass(row.daysInState)}`}>
                      {row.daysInState}d
                    </td>
                    <td
                      className="max-w-[90px] truncate text-[10px] text-muted"
                      title={row.trackingStatus}
                    >
                      {row.trackingStatus}
                    </td>
                    <td>
                      {row.solscanUrl ? (
                        <a
                          href={row.solscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-purple-300 hover:text-accent"
                        >
                          Scan
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div
                        className={`flex flex-nowrap items-center gap-0.5 ${
                          actionsDisabled ? "pointer-events-none" : ""
                        }`}
                      >
                        {row.threadId ? (
                          <EscrowActionButton
                            label="Thread"
                            variant="thread"
                            disabled={actionsDisabled}
                            href={
                              actionsDisabled ? undefined : `/messages/${row.threadId}`
                            }
                          />
                        ) : null}
                        <EscrowActionButton
                          label="Release"
                          variant="release"
                          disabled={actionsDisabled}
                          onClick={
                            actionsDisabled
                              ? undefined
                              : () => setDialog({ type: "release", row })
                          }
                        />
                        <EscrowActionButton
                          label="Refund"
                          variant="refund"
                          disabled={actionsDisabled}
                          onClick={
                            actionsDisabled
                              ? undefined
                              : () => setDialog({ type: "refund", row })
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
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
    </div>
  );
}
