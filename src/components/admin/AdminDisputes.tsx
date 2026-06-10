"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useAdminEscrow } from "@/hooks/useAdminEscrow";
import { useSolPrice } from "@/hooks/useSolPrice";
import { fetchAdminThreadMessages, fetchDisputes } from "@/lib/admin/data";
import type { DisputeRow } from "@/lib/admin/types";
import { getProfileSlug } from "@/lib/profile-links";
import { shortenAddress } from "@/lib/format";

import { useAdminContext } from "./AdminContext";

export default function AdminDisputes() {
  const { showDummyData } = useAdminContext();
  const { solPrice } = useSolPrice();
  const rate = solPrice ?? 132.5;
  const { showToast } = useToast();
  const { resolveDispute, loading: actionLoading } = useAdminEscrow();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, unknown[]>>({});
  const [dialog, setDialog] = useState<{
    row: DisputeRow;
    sellerWins: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchDisputes(showDummyData, tab === "resolved", rate));
    } finally {
      setLoading(false);
    }
  }, [showDummyData, tab, rate]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleExpand = async (row: DisputeRow) => {
    const next = expanded === row.auctionId ? null : row.auctionId;
    setExpanded(next);
    if (next && row.threadId && !messages[row.auctionId]) {
      const msgs = await fetchAdminThreadMessages(row.threadId);
      setMessages((m) => ({ ...m, [row.auctionId]: msgs }));
    }
  };

  const handleConfirm = async () => {
    if (!dialog) return;
    const { row, sellerWins } = dialog;
    const result = await resolveDispute(
      row.auctionId,
      row.sellerWallet,
      row.buyerWallet,
      sellerWins
    );
    if (result.success) {
      showToast(sellerWins ? "Dispute resolved — seller wins." : "Dispute resolved — buyer wins.");
      setDialog(null);
      void load();
    } else {
      showToast(result.error, "error");
    }
  };

  return (
    <>
      <div className="mb-4 flex gap-2">
        {(["open", "resolved"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              tab === t ? "bg-accent/20 text-purple-200" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      ) : !rows.length ? (
        <p className="text-sm text-muted">No {tab} disputes.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.auctionId} className="rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => void toggleExpand(row)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left text-xs"
              >
                <span className="font-mono text-purple-300">{row.reference ?? "—"}</span>
                <Link
                  href={`/auction/${row.auctionId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-white hover:text-accent"
                >
                  {row.itemTitle}
                </Link>
                <span className="text-muted">
                  Seller:{" "}
                  <Link
                    href={`/shop/${getProfileSlug(row.sellerUsername, row.sellerWallet)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-white"
                  >
                    {shortenAddress(row.sellerWallet, 4)}
                  </Link>
                </span>
                <span>{row.daysOpen}d open</span>
                <span>{row.amountSol.toFixed(4)} SOL (~${row.usdApprox.toFixed(2)})</span>
                {row.outcome && (
                  <span className="rounded-full bg-surface-elevated px-2 py-0.5 capitalize">
                    {row.outcome} won
                  </span>
                )}
              </button>

              {expanded === row.auctionId && (
                <div className="border-t border-border px-4 py-3 text-xs text-muted">
                  {row.description && <p className="mb-2 text-zinc-300">{row.description}</p>}
                  {row.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.imageUrl} alt="" className="mb-2 h-24 rounded-lg object-cover" />
                  )}
                  <p className="mb-1 font-medium text-white">Message thread</p>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg bg-background/60 p-2">
                    {(messages[row.auctionId] ?? []).map((msg) => {
                      const m = msg as { id: string; content: string; sender_wallet: string };
                      return (
                        <p key={m.id}>
                          <span className="font-mono text-purple-300">
                            {shortenAddress(m.sender_wallet, 3)}:
                          </span>{" "}
                          {m.content}
                        </p>
                      );
                    })}
                    {!messages[row.auctionId]?.length && <p>No messages loaded.</p>}
                  </div>
                </div>
              )}

              {tab === "open" && (
                <div className="flex gap-2 border-t border-border px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setDialog({ row, sellerWins: true })}
                    className="rounded-full bg-emerald-600/20 px-3 py-1 text-emerald-300"
                  >
                    Seller wins
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ row, sellerWins: false })}
                    className="rounded-full bg-blue-600/20 px-3 py-1 text-blue-300"
                  >
                    Buyer wins
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        title="Resolve dispute"
        message={
          dialog
            ? `Resolve in favor of ${dialog.sellerWins ? "seller" : "buyer"} for ${dialog.row.amountSol.toFixed(4)} SOL? This cannot be undone.`
            : ""
        }
        confirmLabel="Resolve"
        loading={actionLoading}
        onCancel={() => setDialog(null)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
