"use client";

import { formatSol } from "@/lib/format";
import type { NextBidderOfferPayload } from "@/lib/non-payment-resolution";

export default function NextBidderOfferTile({
  offer,
  canRespond,
  loading,
  onAccept,
  onDecline,
}: {
  offer: NextBidderOfferPayload;
  canRespond: boolean;
  loading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const deadline = offer.payment_deadline ?? offer.response_deadline;
  const deadlineLabel = deadline
    ? new Date(deadline).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="w-full rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
      <p className="text-sm font-semibold text-purple-200">
        Next highest bidder offer
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        The original winner of{" "}
        <span className="font-medium text-white">{offer.item_title}</span>{" "}
        didn&apos;t complete payment. You&apos;ve been offered this item for{" "}
        <span className="font-semibold text-white">
          {formatSol(offer.amount_sol)}
        </span>
        .
      </p>
      {deadlineLabel && offer.status === "pending" && (
        <p className="mt-2 text-xs text-muted">
          Respond by {deadlineLabel}
        </p>
      )}
      {offer.status === "accepted" && deadlineLabel && (
        <p className="mt-2 text-xs text-emerald-300">
          Accepted — complete payment by {deadlineLabel}
        </p>
      )}
      {offer.status === "declined" && (
        <p className="mt-2 text-xs text-muted">You declined this offer.</p>
      )}
      {offer.status === "expired" && (
        <p className="mt-2 text-xs text-amber-300">This offer has expired.</p>
      )}

      {canRespond && offer.status === "pending" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            Accept & Pay
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={loading}
            className="flex-1 rounded-full border border-border bg-surface-elevated py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent/40 disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
