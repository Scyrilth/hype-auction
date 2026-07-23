"use client";

import { useMemo, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { TX_FAILED_OR_CANCELLED_MESSAGE, getErrorMessage } from "@/lib/errors";
import { confirmShippingOnChain, createEscrowProvider } from "@/lib/escrow";
import { logEscrowShipped } from "@/lib/escrow-ledger";
import { THREAD_SHIPPING_CARRIERS } from "@/lib/seller-orders";
import type { PendingShipmentGroup } from "@/lib/shipment-groups";

export default function BundleUploadTrackingCard({
  group,
  sellerWallet,
  onSubmitted,
}: {
  group: PendingShipmentGroup;
  sellerWallet: string;
  onSubmitted: () => void;
}) {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const [carrier, setCarrier] = useState<string>(THREAD_SHIPPING_CARRIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pendingOrders = useMemo(
    () => group.orders.filter((order) => !order.hasTracking && order.threadId),
    [group.orders]
  );

  const completedCount = group.orders.length - pendingOrders.length;

  const handleSubmit = async () => {
    if (submitting || submitted || !trackingNumber.trim()) return;

    const trimmedTracking = trackingNumber.trim();
    setSubmitting(true);
    setProgressLabel(null);

    try {
      if (pendingOrders.length > 0) {
        if (!anchorWallet || !connection) {
          showToast("Connect your wallet to submit tracking on-chain.", "error");
          return;
        }

        const provider = createEscrowProvider(connection, anchorWallet);

        for (let index = 0; index < pendingOrders.length; index++) {
          const order = pendingOrders[index];
          setProgressLabel(
            `Confirming shipment ${index + 1} of ${pendingOrders.length}: ${order.title}`
          );

          const onChainResult = await confirmShippingOnChain(
            order.auctionId,
            anchorWallet,
            provider
          );

          if (!onChainResult.success) {
            throw new Error(
              getErrorMessage(onChainResult.error, TX_FAILED_OR_CANCELLED_MESSAGE)
            );
          }

          const response = await fetch("/api/messages/tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: order.threadId,
              sellerWallet,
              carrier,
              trackingNumber: trimmedTracking,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                payload.error,
                `Unable to upload tracking for "${order.title}".`
              )
            );
          }

          const txSignature = onChainResult.txSignature;
          if (txSignature && order.escrowPda && order.amountLamports > 0) {
            try {
              await logEscrowShipped({
                auctionId: order.auctionId,
                threadId: order.threadId,
                sellerWallet,
                escrowPda: order.escrowPda,
                amountLamports: order.amountLamports,
                onChainSignature: txSignature,
              });
            } catch (ledgerError) {
              console.error("Escrow ledger shipped insert failed:", ledgerError);
            }
          }
        }
      }

      setProgressLabel("Saving bundle tracking...");
      const finalizeResponse = await fetch("/api/seller/shipment-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": sellerWallet,
        },
        body: JSON.stringify({
          action: "finalize-tracking",
          sellerWallet,
          groupId: group.groupId,
          carrier,
          trackingNumber: trimmedTracking,
        }),
      });

      const finalizePayload = (await finalizeResponse.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!finalizeResponse.ok) {
        throw new Error(
          getErrorMessage(
            finalizePayload.error,
            "All items were shipped, but bundle tracking could not be saved. Try again."
          )
        );
      }

      setSubmitted(true);
      showToast("Bundle tracking uploaded — buyers notified.");
      onSubmitted();
    } catch (error) {
      const message = getErrorMessage(error, TX_FAILED_OR_CANCELLED_MESSAGE);
      if (completedCount > 0 || pendingOrders.length > 1) {
        showToast(
          `${message} You can retry to finish the remaining items in this bundle.`,
          "error"
        );
      } else {
        showToast(message, "error");
      }
      onSubmitted();
    } finally {
      setSubmitting(false);
      setProgressLabel(null);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm font-semibold text-emerald-200">
        Bundle shipped ✅
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
      <p className="text-sm font-semibold text-white">
        Upload tracking for this bundle
      </p>
      <p className="mt-1 text-xs text-muted">
        {pendingOrders.length > 0
          ? `${pendingOrders.length} item${pendingOrders.length === 1 ? "" : "s"} still need on-chain shipment confirmation.`
          : "All items are shipped — finalize the bundle tracking below."}
        {completedCount > 0 && (
          <span className="block mt-1">
            {completedCount} already completed from a previous attempt.
          </span>
        )}
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted">Tracking number</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Enter tracking number"
            disabled={submitting}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted">Carrier</label>
          <select
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            disabled={submitting}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-60"
          >
            {THREAD_SHIPPING_CARRIERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          {pendingOrders.length > 0
            ? `Each item requires its own on-chain confirmation — expect ${pendingOrders.length} wallet signature${pendingOrders.length === 1 ? "" : "s"} (~0.0001 SOL each).`
            : "All items are already shipped individually — save the shared bundle tracking below."}
        </p>

        {progressLabel && (
          <p className="text-xs font-medium text-amber-200">{progressLabel}</p>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || !trackingNumber.trim()}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Upload tracking for this bundle"}
        </button>
      </div>
    </div>
  );
}
