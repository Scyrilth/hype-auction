"use client";

import { useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";
import { createEscrowProvider } from "@/lib/escrow";
import {
  submitThreadShippingTracking,
  THREAD_SHIPPING_CARRIERS,
} from "@/lib/seller-orders";

export default function UploadTrackingCard({
  threadId,
  sellerWallet,
  onSubmitted,
}: {
  threadId: string;
  sellerWallet: string;
  onSubmitted: () => void;
}) {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const [carrier, setCarrier] = useState<string>(THREAD_SHIPPING_CARRIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const provider =
        anchorWallet && connection
          ? createEscrowProvider(connection, anchorWallet)
          : undefined;

      await submitThreadShippingTracking({
        threadId,
        sellerWallet,
        carrier,
        trackingNumber,
        onChain: provider ? { provider } : undefined,
      });

      setSubmitted(true);
      showToast("Tracking uploaded — buyer notified.");
      onSubmitted();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm font-semibold text-emerald-200">
        Mark as Shipped ✅
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
      <p className="text-sm font-semibold text-white">Upload Tracking</p>
      <p className="mt-1 text-xs text-muted">
        Payment is secured in escrow. Add tracking so the buyer can follow the shipment.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted">Tracking number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Enter tracking number"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Carrier</label>
          <select
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent"
          >
            {THREAD_SHIPPING_CARRIERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || !trackingNumber.trim()}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Tracking"}
        </button>
      </div>
    </div>
  );
}
