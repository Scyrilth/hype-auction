"use client";

import type { SellerOrderNeedingAction } from "@/lib/seller-orders";

export default function BundleOrdersBar({
  selectedCount,
  bundling,
  onBundle,
  onClear,
}: {
  selectedCount: number;
  bundling: boolean;
  onBundle: () => void;
  onClear: () => void;
}) {
  if (selectedCount < 2) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-200">
        {selectedCount} orders selected — ship together with one tracking number
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={bundling}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-elevated disabled:opacity-60"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onBundle}
          disabled={bundling}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {bundling ? "Bundling..." : "Bundle these together"}
        </button>
      </div>
    </div>
  );
}

export function canBundleOrders(orders: SellerOrderNeedingAction[]): boolean {
  return orders.length >= 2;
}
