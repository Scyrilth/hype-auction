"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/Toast";
import type { Auction } from "@/lib/database.types";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { getErrorMessage } from "@/lib/errors";
import { formatSol } from "@/lib/format";
import {
  getRelistSuggestion,
  publishRelist,
} from "@/lib/non-payment-resolution";
import { AUCTION_DURATIONS } from "@/lib/seller";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none focus:border-accent";

export default function RelistAuctionModal({
  open,
  auction,
  excludeWallets,
  sellerWallet,
  onClose,
  onRelisted,
}: {
  open: boolean;
  auction: Auction;
  excludeWallets: string[];
  sellerWallet: string;
  onClose: () => void;
  onRelisted: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [startPrice, setStartPrice] = useState("");
  const [durationHours, setDurationHours] = useState(
    String(AUCTION_DURATIONS[4].hours)
  );
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    void getRelistSuggestion(auction.id, excludeWallets).then((suggested) => {
      if (suggested > 0) {
        setStartPrice(suggested.toFixed(2));
      } else if (auction.current_bid > 0) {
        setStartPrice(auction.current_bid.toFixed(2));
      } else {
        setStartPrice(auction.start_price.toFixed(2));
      }
    });
  }, [auction, excludeWallets, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const imageSrc = resolveAuctionImageUrl(auction.image_url, {
    title: auction.title,
    category: auction.category,
  });

  const handlePublish = async () => {
    const price = parseFloat(startPrice);
    const hours = parseInt(durationHours, 10);
    if (!Number.isFinite(price) || price <= 0) {
      showToast("Enter a valid starting price.", "error");
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      showToast("Select a valid duration.", "error");
      return;
    }

    setLoading(true);
    try {
      const newAuctionId = await publishRelist({
        sourceAuctionId: auction.id,
        sellerWallet,
        startPrice: price,
        durationHours: hours,
      });
      showToast("Item relisted successfully.");
      onRelisted();
      router.push(`/auction/${newAuctionId}`);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold text-white">Relist item</h3>
        <p className="mt-1 text-sm text-muted">
          Create a new auction with the same item details. Previous bidders will
          be notified.
        </p>

        <div className="mt-5 flex gap-3 rounded-xl border border-border bg-background/60 p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageSrc}
              alt={auction.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white">{auction.title}</p>
            <p className="text-xs text-muted">{auction.category}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              Starting price (SOL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={startPrice}
              onChange={(event) => setStartPrice(event.target.value)}
              className={inputClass}
            />
            {startPrice && (
              <p className="mt-1 text-xs text-muted">
                Suggested from recent bids: {formatSol(parseFloat(startPrice) || 0)}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              Duration
            </label>
            <select
              value={durationHours}
              onChange={(event) => setDurationHours(event.target.value)}
              className={inputClass}
            >
              {AUCTION_DURATIONS.map((duration) => (
                <option key={duration.hours} value={duration.hours}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-elevated disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            Publish Relist
          </button>
        </div>

        {confirmOpen && (
          <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
            <p className="text-sm text-zinc-300">
              Publish a new listing for{" "}
              <span className="font-medium text-white">{auction.title}</span>{" "}
              starting at {formatSol(parseFloat(startPrice) || 0)}?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={loading}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white"
              >
                {loading ? "Publishing..." : "Confirm publish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
