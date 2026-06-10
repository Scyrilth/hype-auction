"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { fetchFlaggedOrders } from "@/lib/admin/data";
import type { FlaggedOrder } from "@/lib/admin/types";
import { shortenAddress } from "@/lib/format";

import { useAdminContext } from "./AdminContext";

type Filter = "all" | "domestic" | "international";
type SortKey = "days" | "amount" | "grace";

export default function AdminFlaggedOrders() {
  const { showDummyData } = useAdminContext();
  const { showToast } = useToast();
  const { releaseToSeller, refundToBuyer, loading: actionLoading } = useAdminEscrow();
  const [rows, setRows] = useState<FlaggedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("days");
  const [dialog, setDialog] = useState<{
    type: "release" | "refund";
    row: FlaggedOrder;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchFlaggedOrders(showDummyData));
    } finally {
      setLoading(false);
    }
  }, [showDummyData]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (filter === "domestic") list = list.filter((r) => !r.isInternational);
    if (filter === "international") list = list.filter((r) => r.isInternational);
    list.sort((a, b) => {
      if (sortKey === "amount") return b.amountSol - a.amountSol;
      if (sortKey === "grace")
        return new Date(a.graceExpiresAt).getTime() - new Date(b.graceExpiresAt).getTime();
      return b.daysSincePayment - a.daysSincePayment;
    });
    return list;
  }, [rows, filter, sortKey]);

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
      showToast(type === "release" ? "Released to seller." : "Refunded to buyer.");
      setDialog(null);
      void load();
    } else {
      showToast(result.error, "error");
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-surface" />;
  }

  if (!filtered.length) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 text-sm text-muted">No flagged orders</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "domestic", "international"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              filter === f ? "bg-accent/20 text-purple-200" : "text-muted"
            }`}
          >
            {f}
          </button>
        ))}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="ml-auto rounded-lg border border-border bg-surface-elevated px-2 py-1 text-xs text-white"
        >
          <option value="days">Days since payment</option>
          <option value="amount">Amount</option>
          <option value="grace">Grace expiry</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">Buyer</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Grace</th>
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
                </td>
                <td className="px-3 py-2 font-mono">{shortenAddress(row.sellerWallet, 4)}</td>
                <td className="px-3 py-2 font-mono">{shortenAddress(row.buyerWallet, 4)}</td>
                <td className="px-3 py-2">{new Date(row.paymentDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{row.daysSincePayment}d</td>
                <td className="px-3 py-2">
                  <p>{row.graceLabel}</p>
                  <p className="text-muted">{new Date(row.graceExpiresAt).toLocaleDateString()}</p>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "release", row })}
                      className="rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-300"
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "refund", row })}
                      className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300"
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
        title={dialog?.type === "release" ? "Release to seller" : "Refund to buyer"}
        message={
          dialog?.type === "release"
            ? `Release ${dialog.row.amountSol.toFixed(4)} SOL to seller ${shortenAddress(dialog.row.sellerWallet, 4)}? This cannot be undone.`
            : `Refund ${dialog?.row.amountSol.toFixed(4)} SOL to buyer ${shortenAddress(dialog?.row.buyerWallet ?? "", 4)}? This cannot be undone.`
        }
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
