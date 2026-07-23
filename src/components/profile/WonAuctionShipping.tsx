"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import TrackingCopyButton from "@/components/ui/TrackingCopyButton";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { createEscrowProvider, PLATFORM_WALLET } from "@/lib/escrow";
import {
  confirmReceipt,
  createAuctionThread,
  getAuctionThreadId,
} from "@/lib/messages";

export default function WonAuctionShipping({
  auction,
  bundleReference = null,
}: {
  auction: Auction;
  bundleReference?: string | null;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const { client } = useSupabaseClient();
  const [confirming, setConfirming] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [localStatus, setLocalStatus] = useState(auction.shipping_status);

  const wallet = publicKey?.toBase58();
  const status =
    localStatus === "shipped" || localStatus === "delivered"
      ? localStatus
      : "pending";

  const handleMessageSeller = async () => {
    if (!wallet || messaging) return;
    setMessaging(true);
    try {
      const thread = await createAuctionThread(
        auction.id,
        wallet,
        auction.seller_wallet,
        auction.title,
        undefined,
        client
      );
      router.push(`/messages/${thread.id}`);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setMessaging(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!wallet || confirming) return;

    if (!anchorWallet || !connection) {
      showToast("Connect your wallet to confirm receipt on-chain.", "error");
      return;
    }

    setConfirming(true);
    try {
      const threadId = await getAuctionThreadId(auction.id, wallet);
      if (!threadId) {
        showToast("Open a message thread with the seller first.", "error");
        return;
      }
      const provider = createEscrowProvider(connection, anchorWallet);
      const result = await confirmReceipt(
        threadId,
        wallet,
        {
          provider,
          sellerWallet: auction.seller_wallet,
          platformWallet: PLATFORM_WALLET,
        },
        client
      );
      setLocalStatus("delivered");
      showToast(
        result.onChainSuccess
          ? "✅ Receipt confirmed on-chain"
          : "Receipt confirmed!"
      );
      router.refresh();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border/80 bg-background/40 p-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {auction.reference_number && (
          <ReferenceNumber referenceNumber={auction.reference_number} />
        )}
        {bundleReference && (
          <ReferenceNumber
            referenceNumber={bundleReference}
            className="text-amber-200/90"
          />
        )}

        {status === "pending" && (
          <span className="text-xs text-muted">Awaiting shipment...</span>
        )}

        {status === "shipped" && (
          <>
            {auction.tracking_courier && (
              <span className="text-xs font-medium text-zinc-200">
                {auction.tracking_courier}
              </span>
            )}
            {auction.tracking_number && (
              <span className="inline-flex items-center gap-1">
                <span className="font-mono text-[11px] text-purple-300">
                  {auction.tracking_number}
                </span>
                <TrackingCopyButton value={auction.tracking_number} />
              </span>
            )}
          </>
        )}

        {status === "delivered" && (
          <span className="inline-flex rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
            Delivered ✓
          </span>
        )}
      </div>

      {status === "shipped" && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={confirming || messaging}
            onClick={handleConfirmReceipt}
            className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {confirming ? "Confirming..." : "Confirm Receipt"}
          </button>
          <button
            type="button"
            disabled={confirming || messaging}
            onClick={handleMessageSeller}
            className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
          >
            {messaging ? "Opening..." : "Message Seller"}
          </button>
        </div>
      )}
    </div>
  );
}
