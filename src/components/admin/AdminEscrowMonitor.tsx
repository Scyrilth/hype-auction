"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { adminTabClass } from "@/components/admin/admin-tab-styles";
import { adminActionButtonClass } from "@/components/admin/admin-button-styles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { getErrorMessage } from "@/lib/errors";
import { fetchEscrowMonitor } from "@/lib/admin/data";
import type { EscrowMonitorRow, EscrowSummaryPill } from "@/lib/admin/types";
import { shortenAddress } from "@/lib/format";

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
      return "bg-emerald-500/15 text-emerald-300";
    case "disputed":
      return "bg-red-500/15 text-red-300";
    case "refunded":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-accent/15 text-purple-300";
  }
}

export default function AdminEscrowMonitor() {
  const { showDummyData } = useAdminContext();
  const { showToast } = useToast();
  const { releaseToSeller, refundToBuyer, loading: actionLoading } = useAdminEscrow();
  const [rows, setRows] = useState<EscrowMonitorRow[]>([]);
  const [pills, setPills] = useState<EscrowSummaryPill[]>([]);
  const [platformFeesSol, setPlatformFeesSol] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{
    type: "release" | "refund";
    row: EscrowMonitorRow;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEscrowMonitor(showDummyData);
      setRows(data.rows);
      setPills(data.pills);
      setPlatformFeesSol(data.platformFeesSol);
    } finally {
      setLoading(false);
    }
  }, [showDummyData]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (filter !== "all") {
      if (filter === "flagged") list = list.filter((r) => r.isFlagged);
      else if (filter === "funded")
        list = list.filter((r) => ["funded", "pending"].includes(r.escrowState));
      else if (filter === "released")
        list = list.filter((r) => ["released", "complete"].includes(r.escrowState));
      else list = list.filter((r) => r.escrowState === filter);
    }
    return list.sort((a, b) => b.daysInState - a.daysInState);
  }, [rows, filter]);

  const handleConfirm = async () => {
    if (!dialog) return;
    const { row, type } = dialog;
    const result =
      type === "release"
        ? await releaseToSeller(
            row.auctionId,
            row.escrowState,
            row.sellerWallet,
            row.buyerWallet
          )
        : await refundToBuyer(
            row.auctionId,
            row.buyerWallet,
            row.sellerWallet,
            row.escrowState
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
            Platform fees collected
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {platformFeesSol.toFixed(4)} SOL
          </p>
        </div>
      </div>

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
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Tx</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.auctionId} className="border-t border-border/60">
                <td className="px-3 py-2 font-mono text-purple-300">
                  {row.reference ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/auction/${row.auctionId}`} className="text-white hover:text-accent">
                    {row.itemTitle}
                  </Link>
                  <p className="text-muted">
                    {shortenAddress(row.sellerWallet, 3)} → {shortenAddress(row.buyerWallet, 3)}
                  </p>
                </td>
                <td className="px-3 py-2">{row.amountSol.toFixed(4)} SOL</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 capitalize ${badgeClass(row.escrowState)}`}>
                    {row.escrowState}
                  </span>
                </td>
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
                  <div className="flex flex-wrap gap-1">
                    {row.threadId && (
                      <Link
                        href={`/messages/${row.threadId}`}
                        target="_blank"
                        className={adminActionButtonClass.thread}
                      >
                        Thread
                      </Link>
                    )}
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
                  </div>
                </td>
              </tr>
            ))}
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
