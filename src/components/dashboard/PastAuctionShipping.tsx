"use client";

import { useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import TrackingCopyButton from "@/components/ui/TrackingCopyButton";
import { useToast } from "@/components/ui/Toast";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { createEscrowProvider } from "@/lib/escrow";
import { saveAuctionShippingTracking, SHIPPING_COURIERS } from "@/lib/logistics";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

export default function PastAuctionShipping({
  auction: initialAuction,
  onUpdated,
}: {
  auction: Auction;
  onUpdated?: (auction: Auction) => void;
}) {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { showToast } = useToast();
  const [auction, setAuction] = useState(initialAuction);
  const [showForm, setShowForm] = useState(false);
  const [courier, setCourier] = useState<string>(SHIPPING_COURIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const wallet = publicKey?.toBase58();
  const status = auction.shipping_status ?? "pending";

  const handleSave = async () => {
    if (!wallet || saving) return;
    setSaving(true);
    try {
      const provider =
        anchorWallet && connection
          ? createEscrowProvider(connection, anchorWallet)
          : undefined;
      const updated = await saveAuctionShippingTracking({
        auctionId: auction.id,
        sellerWallet: wallet,
        courier,
        trackingNumber,
        onChain: provider ? { provider } : undefined,
      }, client);
      setAuction(updated);
      setShowForm(false);
      setTrackingNumber("");
      showToast("Shipping saved — buyer notified.");
      onUpdated?.(updated);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pointer-events-auto mt-3 rounded-xl border border-border bg-background/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Shipping
        </p>
        {auction.reference_number && (
          <ReferenceNumber referenceNumber={auction.reference_number} />
        )}
      </div>

      {status === "pending" && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 w-full rounded-full border border-border py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
        >
          Mark as Shipped
        </button>
      )}

      {status === "pending" && showForm && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted">Courier</label>
            <select
              value={courier}
              onChange={(event) => setCourier(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent"
            >
              {SHIPPING_COURIERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Tracking number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="Enter tracking number"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-full border border-border py-2 text-xs font-medium text-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !trackingNumber.trim()}
              onClick={handleSave}
              className="flex-1 rounded-full bg-accent py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save & Notify Buyer"}
            </button>
          </div>
        </div>
      )}

      {status === "shipped" && (
        <div className="mt-2 space-y-2">
          <span className="inline-flex rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
            Shipped ✓
          </span>
          {auction.tracking_courier && auction.tracking_number && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
              <span>{auction.tracking_courier}</span>
              <span className="font-mono text-xs text-purple-300">
                {auction.tracking_number}
              </span>
              <TrackingCopyButton value={auction.tracking_number} />
            </div>
          )}
        </div>
      )}

      {status === "delivered" && (
        <div className="mt-2">
          <span className="inline-flex rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
            Delivered ✓
          </span>
          {auction.tracking_courier && auction.tracking_number && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-200">
              <span>{auction.tracking_courier}</span>
              <span className="font-mono text-xs text-purple-300">
                {auction.tracking_number}
              </span>
              <TrackingCopyButton value={auction.tracking_number} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
