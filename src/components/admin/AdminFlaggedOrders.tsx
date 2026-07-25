"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { adminTabClass } from "@/components/admin/admin-tab-styles";
import { adminActionButtonClass } from "@/components/admin/admin-button-styles";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { getErrorMessage } from "@/lib/errors";
import {
  fetchAdminLiveAuctions,
  fetchEarlyEndedAuctions,
  fetchFlaggedOrders,
} from "@/lib/admin/data";
import type {
  AdminLiveAuctionRow,
  EarlyEndedAuctionRow,
  FlaggedOrder,
} from "@/lib/admin/types";
import { formatSol, shortenAddress } from "@/lib/format";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

import { useAdminContext } from "./AdminContext";

type PanelTab = "unshipped" | "early_ended" | "live";
type Filter = "all" | "domestic" | "international";
type SortKey = "days" | "amount" | "grace";

export default function AdminFlaggedOrders() {
  const { showDummyData } = useAdminContext();
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const { releaseToSeller, refundToBuyer, loading: actionLoading } = useAdminEscrow();
  const [panelTab, setPanelTab] = useState<PanelTab>("unshipped");
  const [rows, setRows] = useState<FlaggedOrder[]>([]);
  const [earlyEndedRows, setEarlyEndedRows] = useState<EarlyEndedAuctionRow[]>([]);
  const [liveRows, setLiveRows] = useState<AdminLiveAuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingAuctionId, setEndingAuctionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("days");
  const [dialog, setDialog] = useState<{
    type: "release" | "refund";
    row: FlaggedOrder;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flagged, earlyEnded, live] = await Promise.all([
        fetchFlaggedOrders(showDummyData),
        fetchEarlyEndedAuctions(showDummyData),
        fetchAdminLiveAuctions(showDummyData),
      ]);
      setRows(flagged);
      setEarlyEndedRows(earlyEnded);
      setLiveRows(live);
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
      showToast(getErrorMessage(result.error), "error");
    }
  };

  const handleAdminEndAuction = async (auctionId: string) => {
    const wallet = publicKey?.toBase58();
    if (!wallet) {
      showToast("Connect your admin wallet.", "error");
      return;
    }

    setEndingAuctionId(auctionId);
    try {
      const response = await fetch("/api/admin/end-auction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": wallet,
          ...getWalletAuthHeaders(),
        },
        body: JSON.stringify({ auctionId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to end auction.");
      }
      showToast("Auction ended.");
      void load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setEndingAuctionId(null);
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["unshipped", "Unshipped"],
            ["early_ended", "Early Ended"],
            ["live", "Live Listings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanelTab(id)}
            className={adminTabClass(panelTab === id)}
          >
            {label}
          </button>
        ))}
      </div>

      {panelTab === "early_ended" ? (
        !earlyEndedRows.length ? (
          <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
            <p className="text-sm text-muted">No early-ended auctions with bids</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Seller</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Ended at</th>
                  <th className="px-3 py-2">Highest bid</th>
                  <th className="px-3 py-2">Buyer</th>
                </tr>
              </thead>
              <tbody>
                {earlyEndedRows.map((row) => (
                  <tr key={row.auctionId} className="border-t border-border/60">
                    <td className="px-3 py-2">
                      <Link
                        href={`/auction/${row.auctionId}`}
                        className="text-white hover:text-accent"
                      >
                        {row.itemTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {shortenAddress(row.sellerWallet, 4)}
                    </td>
                    <td className="px-3 py-2">{row.earlyEndReason}</td>
                    <td className="px-3 py-2">
                      {new Date(row.earlyEndAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{formatSol(row.highestBidSol)}</td>
                    <td className="px-3 py-2 font-mono">
                      {shortenAddress(row.buyerWallet, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : panelTab === "live" ? (
        !liveRows.length ? (
          <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
            <p className="text-sm text-muted">No live listings</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Seller</th>
                  <th className="px-3 py-2">Current bid</th>
                  <th className="px-3 py-2">Bids</th>
                  <th className="px-3 py-2">Ends</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {liveRows.map((row) => (
                  <tr key={row.auctionId} className="border-t border-border/60">
                    <td className="px-3 py-2">
                      <Link
                        href={`/auction/${row.auctionId}`}
                        className="text-white hover:text-accent"
                      >
                        {row.itemTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {shortenAddress(row.sellerWallet, 4)}
                    </td>
                    <td className="px-3 py-2">{formatSol(row.currentBidSol)}</td>
                    <td className="px-3 py-2">{row.bidCount}</td>
                    <td className="px-3 py-2">
                      {new Date(row.endTime).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void handleAdminEndAuction(row.auctionId)}
                        disabled={endingAuctionId === row.auctionId}
                        className={adminActionButtonClass.refund}
                      >
                        {endingAuctionId === row.auctionId
                          ? "Ending..."
                          : "End Auction"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : !filtered.length ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-2 text-sm text-muted">No flagged orders</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "domestic", "international"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={adminTabClass(filter === f)}
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
                      <Link
                        href={`/auction/${row.auctionId}`}
                        className="text-white hover:text-accent"
                      >
                        {row.itemTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {shortenAddress(row.sellerWallet, 4)}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {shortenAddress(row.buyerWallet, 4)}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(row.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">{row.daysSincePayment}d</td>
                    <td className="px-3 py-2">
                      <p>{row.graceLabel}</p>
                      <p className="text-muted">
                        {new Date(row.graceExpiresAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
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
        </>
      )}

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
