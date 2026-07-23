"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useSolPrice } from "@/hooks/useSolPrice";
import { usdToLamports } from "@/lib/escrow";
import { TX_FAILED_OR_CANCELLED_MESSAGE, getErrorMessage } from "@/lib/errors";
import { formatUsdSol, truncateWalletAddress } from "@/lib/format";
import {
  fetchBundleRefundNudges,
  type BundleRefundNudge,
} from "@/lib/shipment-groups";
import { sendWalletSolTransfer } from "@/lib/wallet-sol-transfer";

const REFUND_TRANSFER_FEE_BUFFER_SOL = 0.001;

function estimatedSolFromUsd(usdAmount: number, solPriceUsd: number | null) {
  if (!solPriceUsd || solPriceUsd <= 0) return null;
  return usdAmount / solPriceUsd;
}

export default function BundleRefundNudgeSection({
  sellerWallet,
}: {
  sellerWallet: string;
}) {
  const { client } = useSupabaseClient();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { solPrice } = useSolPrice();
  const { showToast } = useToast();
  const [nudges, setNudges] = useState<BundleRefundNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchBundleRefundNudges(sellerWallet, client);
      setNudges(items);
    } catch (error) {
      console.error("[BundleRefundNudgeSection] load failed:", error);
      setNudges([]);
    } finally {
      setLoading(false);
    }
  }, [client, sellerWallet]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedNudges = useMemo(
    () =>
      [...nudges].sort(
        (left, right) => right.estimatedSavingsUsd - left.estimatedSavingsUsd
      ),
    [nudges]
  );

  const handleDismiss = async (groupId: string) => {
    if (activeGroupId) return;

    setActiveGroupId(groupId);
    try {
      const response = await fetch("/api/seller/shipment-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": sellerWallet,
        },
        body: JSON.stringify({
          action: "dismiss-refund-nudge",
          sellerWallet,
          groupId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload.error, "Unable to dismiss refund nudge.")
        );
      }

      setNudges((current) => current.filter((nudge) => nudge.groupId !== groupId));
      showToast("Refund nudge dismissed.");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to dismiss refund nudge."), "error");
    } finally {
      setActiveGroupId(null);
    }
  };

  const handleSendRefund = async (nudge: BundleRefundNudge) => {
    if (activeGroupId) return;

    if (!anchorWallet || !connection) {
      showToast("Connect your wallet to send a refund.", "error");
      return;
    }

    setActiveGroupId(nudge.groupId);

    try {
      const lamports = await usdToLamports(nudge.estimatedSavingsUsd);
      const refundSol = lamports / LAMPORTS_PER_SOL;
      const requiredSol = refundSol + REFUND_TRANSFER_FEE_BUFFER_SOL;
      const balanceLamports = await connection.getBalance(anchorWallet.publicKey);
      const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

      if (balanceSol < requiredSol) {
        throw new Error(
          `You need about ${requiredSol.toFixed(4)} SOL to send this refund, but your wallet only has ${balanceSol.toFixed(4)}`
        );
      }

      const transferResult = await sendWalletSolTransfer({
        connection,
        wallet: anchorWallet,
        recipientWallet: nudge.buyerWallet,
        lamports,
      });

      if (!transferResult.success) {
        throw new Error(
          getErrorMessage(transferResult.error, TX_FAILED_OR_CANCELLED_MESSAGE)
        );
      }

      const solAmount = lamports / LAMPORTS_PER_SOL;
      const response = await fetch("/api/seller/shipment-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": sellerWallet,
        },
        body: JSON.stringify({
          action: "record-refund",
          sellerWallet,
          groupId: nudge.groupId,
          txSignature: transferResult.txSignature,
          solAmount,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload.error,
            "Refund was sent on-chain but could not be recorded. Contact support with your transaction signature."
          )
        );
      }

      setNudges((current) =>
        current.filter((entry) => entry.groupId !== nudge.groupId)
      );
      showToast("Shipping refund sent — buyer notified.");
    } catch (error) {
      showToast(getErrorMessage(error, TX_FAILED_OR_CANCELLED_MESSAGE), "error");
    } finally {
      setActiveGroupId(null);
    }
  };

  if (loading || sortedNudges.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Voluntary shipping refunds
        </h2>
        <p className="mt-1 text-sm text-muted">
          These bundles shipped together — you can optionally refund the extra
          shipping buyers paid on combined orders.
        </p>
      </div>

      <div className="space-y-4">
        {sortedNudges.map((nudge) => {
          const estimatedSol = estimatedSolFromUsd(
            nudge.estimatedSavingsUsd,
            solPrice
          );
          const busy = activeGroupId === nudge.groupId;

          return (
            <article
              key={nudge.groupId}
              className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-100">
                  Refund extra shipping
                </p>
                <p className="text-sm text-zinc-300">
                  {nudge.itemCount} items shipped to{" "}
                  {truncateWalletAddress(nudge.buyerWallet)}
                </p>
                <ReferenceNumber
                  referenceNumber={nudge.bundleReference}
                  className="text-[11px] text-emerald-200/90"
                />
                <p className="text-sm text-zinc-200">
                  Estimated savings:{" "}
                  <span className="font-semibold text-white">
                    ${nudge.estimatedSavingsUsd.toFixed(2)}
                  </span>
                  {estimatedSol != null && (
                    <span className="text-muted">
                      {" "}
                      (~{estimatedSol.toFixed(4)} SOL
                      {solPrice ? ` · ${formatUsdSol(estimatedSol, solPrice)}` : ""})
                    </span>
                  )}
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  Sends a direct SOL transfer from your wallet at the current
                  rate. The buyer is notified after the transaction confirms.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleSendRefund(nudge)}
                  disabled={busy || Boolean(activeGroupId)}
                  className="flex-1 rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Sending..." : "Send refund"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDismiss(nudge.groupId)}
                  disabled={busy || Boolean(activeGroupId)}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  Dismiss
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
