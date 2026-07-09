"use client";

import { useEffect, useState } from "react";

import type { EarlyEndReason } from "@/lib/auction-early-end";
import { EARLY_END_REASONS } from "@/lib/auction-early-end";
import { formatSol, shortenAddress } from "@/lib/format";

const selectClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent";

export default function EndAuctionEarlyModal({
  open,
  hasBids,
  itemTitle,
  highestBidSol,
  highestBidderWallet,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  hasBids: boolean;
  itemTitle: string;
  highestBidSol: number;
  highestBidderWallet: string | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: EarlyEndReason | null) => void;
}) {
  const [reason, setReason] = useState<EarlyEndReason | "">("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const canConfirm = hasBids ? Boolean(reason) : true;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-auction-early-title"
      >
        <h2 id="end-auction-early-title" className="text-lg font-semibold text-white">
          End Auction Early?
        </h2>

        {hasBids ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-zinc-300">
              Current highest bid:{" "}
              <span className="font-semibold text-accent">
                {formatSol(highestBidSol)}
              </span>
              {highestBidderWallet ? (
                <>
                  {" "}
                  by{" "}
                  <span className="font-mono text-purple-300">
                    {shortenAddress(highestBidderWallet, 6)}
                  </span>
                </>
              ) : null}
            </p>

            <label className="block text-sm text-zinc-300">
              Reason for ending early
              <select
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as EarlyEndReason | "")
                }
                className={selectClass}
              >
                <option value="">Select a reason</option>
                {EARLY_END_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              ⚠️ This will immediately declare the current highest bidder as the
              winner. Payment flow will begin and this cannot be undone.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-300">
            This listing has no bids. It will be closed immediately with no winner.
            {itemTitle ? (
              <>
                {" "}
                Listing: <span className="text-white">{itemTitle}</span>
              </>
            ) : null}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm || loading}
            onClick={() => onConfirm(hasBids ? (reason as EarlyEndReason) : null)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Ending..."
              : hasBids
                ? "End Auction Early"
                : "End Auction"}
          </button>
        </div>
      </div>
    </div>
  );
}
