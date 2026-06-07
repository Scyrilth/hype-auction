"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import TrackingCopyButton from "@/components/ui/TrackingCopyButton";
import { useToast } from "@/components/ui/Toast";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import {
  confirmReceipt,
  createAuctionThread,
  getAuctionThreadId,
} from "@/lib/messages";

export default function WonAuctionShipping({ auction }: { auction: Auction }) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { showToast } = useToast();
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
        auction.title
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
    setConfirming(true);
    try {
      const threadId = await getAuctionThreadId(auction.id, wallet);
      if (!threadId) {
        showToast("Open a message thread with the seller first.", "error");
        return;
      }
      await confirmReceipt(threadId, wallet);
      setLocalStatus("delivered");
      showToast("Receipt confirmed!");
      router.refresh();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-background/40 p-3">
      {auction.reference_number && (
        <div className="mb-2">
          <ReferenceNumber referenceNumber={auction.reference_number} />
        </div>
      )}

      {status === "pending" && (
        <p className="text-sm text-muted">Awaiting shipment...</p>
      )}

      {status === "shipped" && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
            {auction.tracking_courier && (
              <span className="font-medium">{auction.tracking_courier}</span>
            )}
            {auction.tracking_number && (
              <>
                <span className="font-mono text-xs text-purple-300">
                  {auction.tracking_number}
                </span>
                <TrackingCopyButton value={auction.tracking_number} />
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={confirming || messaging}
              onClick={handleConfirmReceipt}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {confirming ? "Confirming..." : "Confirm Receipt"}
            </button>
            <button
              type="button"
              disabled={confirming || messaging}
              onClick={handleMessageSeller}
              className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
            >
              {messaging ? "Opening..." : "Message Seller"}
            </button>
          </div>
        </div>
      )}

      {status === "delivered" && (
        <span className="inline-flex rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
          Delivered ✓
        </span>
      )}
    </div>
  );
}
