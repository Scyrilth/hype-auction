"use client";

import Link from "next/link";

import type { ShippingAddress } from "@/lib/database.types";

function formatAddressSummary(address: ShippingAddress): string {
  const parts = [
    address.full_name,
    address.address_line1,
    address.address_line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function BidAddressPromptModal({
  open,
  addresses,
  profilePath,
  onContinue,
  onClose,
}: {
  open: boolean;
  addresses: ShippingAddress[];
  profilePath: string;
  onContinue: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const defaultAddress =
    addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
  const hasAddress = Boolean(defaultAddress);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white">Add a shipping address first</h2>
        <p className="mt-2 text-sm text-muted">
          You need a shipping address before bidding. If you win, the seller will
          use this to ship your item.
        </p>

        {hasAddress && defaultAddress && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <span aria-hidden>✓</span>
              Default shipping address
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              {formatAddressSummary(defaultAddress)}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`${profilePath}#shipping`}
            className="flex-1 rounded-full border border-border py-2.5 text-center text-sm font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Add Address →
          </Link>
          <button
            type="button"
            disabled={!hasAddress}
            onClick={onContinue}
            className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue Bidding
          </button>
        </div>
      </div>
    </div>
  );
}
