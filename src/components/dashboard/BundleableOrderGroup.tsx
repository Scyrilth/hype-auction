"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import BundleOrdersBar, {
  canBundleOrders,
} from "@/components/dashboard/BundleOrdersBar";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { formatPaidAgo, truncateWalletAddress } from "@/lib/format";
import {
  getOrderThumbnail,
  type SellerOrderNeedingAction,
} from "@/lib/seller-orders";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

function OrderCard({
  order,
  selectable,
  selected,
  onToggle,
}: {
  order: SellerOrderNeedingAction;
  selectable: boolean;
  selected: boolean;
  onToggle: (auctionId: string) => void;
}) {
  const thumb = getOrderThumbnail(order.title, order.imageUrl, null);
  const waitingLabel = formatPaidAgo(order.urgencyAt);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {selectable && (
          <label className="mt-1 flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(order.auctionId)}
              className="h-4 w-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent"
            />
            <span className="sr-only">Select {order.title}</span>
          </label>
        )}

        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
          <Image
            src={thumb}
            alt={order.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">
            {order.title}
          </h3>
          {order.referenceNumber && (
            <div className="mt-1">
              <ReferenceNumber
                referenceNumber={order.referenceNumber}
                className="text-[11px] text-muted"
              />
            </div>
          )}
          <p className="mt-1.5 text-sm text-zinc-300">{order.actionLabel}</p>
          {waitingLabel && (
            <p className="mt-1 text-xs text-muted">{waitingLabel}</p>
          )}
        </div>
      </div>

      <Link
        href={order.buttonHref}
        className="shrink-0 rounded-full bg-accent px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:px-5"
      >
        {order.buttonLabel}
      </Link>
    </article>
  );
}

export default function BundleableOrderGroup({
  buyerWallet,
  orders,
  sellerWallet,
  onBundled,
}: {
  buyerWallet: string;
  orders: SellerOrderNeedingAction[];
  sellerWallet: string;
  onBundled: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bundling, setBundling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectable = canBundleOrders(orders);
  const selectedCount = selectedIds.size;

  const selectedTitles = useMemo(
    () =>
      orders
        .filter((order) => selectedIds.has(order.auctionId))
        .map((order) => order.title),
    [orders, selectedIds]
  );

  const toggleSelection = (auctionId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(auctionId)) {
        next.delete(auctionId);
      } else {
        next.add(auctionId);
      }
      return next;
    });
    setError(null);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setError(null);
  };

  const handleBundle = async () => {
    if (selectedIds.size < 2) return;

    const summary = selectedTitles.join("\n• ");
    const confirmed = window.confirm(
      `Bundle these ${selectedIds.size} orders for ${truncateWalletAddress(buyerWallet)}?\n\n• ${summary}\n\nThey will ship together with one tracking number.`
    );

    if (!confirmed) return;

    setBundling(true);
    setError(null);

    try {
      const response = await fetch("/api/seller/shipment-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": sellerWallet,
          ...getWalletAuthHeaders(),
        },
        body: JSON.stringify({
          sellerWallet,
          auctionIds: [...selectedIds],
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        bundleReference?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create bundle.");
      }

      setSelectedIds(new Set());
      onBundled();
    } catch (bundleError) {
      setError(
        bundleError instanceof Error
          ? bundleError.message
          : "Unable to create bundle."
      );
    } finally {
      setBundling(false);
    }
  };

  return (
    <div className="space-y-3">
      {selectable && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {orders.length} orders from {truncateWalletAddress(buyerWallet)}
          </p>
        </div>
      )}

      {orders.map((order) => (
        <OrderCard
          key={order.threadId}
          order={order}
          selectable={selectable}
          selected={selectedIds.has(order.auctionId)}
          onToggle={toggleSelection}
        />
      ))}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {selectable && (
        <BundleOrdersBar
          selectedCount={selectedCount}
          bundling={bundling}
          onBundle={() => void handleBundle()}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}
