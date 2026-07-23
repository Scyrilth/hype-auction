"use client";

import Image from "next/image";

import BundleUploadTrackingCard from "@/components/dashboard/BundleUploadTrackingCard";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { formatPaidAgo, truncateWalletAddress } from "@/lib/format";
import { getOrderThumbnail } from "@/lib/seller-orders";
import type { PendingShipmentGroup } from "@/lib/shipment-groups";

export default function PendingBundleGroupCard({
  group,
  sellerWallet,
  onTrackingUploaded,
}: {
  group: PendingShipmentGroup;
  sellerWallet: string;
  onTrackingUploaded: () => void;
}) {
  const waitingLabel = formatPaidAgo(group.urgencyAt);
  const previewOrders = group.orders.slice(0, 3);
  const remainingCount = group.orders.length - previewOrders.length;
  const pendingCount = group.orders.filter((order) => !order.hasTracking).length;

  return (
    <article className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-100">
              Bundled — tracking pending
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {group.orders.length} items for{" "}
              {truncateWalletAddress(group.buyerWallet)}
              {pendingCount < group.orders.length && (
                <span className="text-muted">
                  {" "}
                  · {pendingCount} left to ship
                </span>
              )}
            </p>
          </div>

          <ReferenceNumber
            referenceNumber={group.bundleReference}
            className="text-[11px] text-amber-200/90"
          />

          {waitingLabel && (
            <p className="text-xs text-muted">Oldest payment {waitingLabel}</p>
          )}

          <ul className="space-y-2 pt-1">
            {previewOrders.map((order) => {
              const thumb = getOrderThumbnail(order.title, order.imageUrl, null);

              return (
                <li
                  key={order.auctionId}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
                    <Image
                      src={thumb}
                      alt={order.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="truncate">{order.title}</span>
                  {order.hasTracking && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-emerald-300">
                      Shipped
                    </span>
                  )}
                </li>
              );
            })}
            {remainingCount > 0 && (
              <li className="text-xs text-muted">+{remainingCount} more</li>
            )}
          </ul>
        </div>
      </div>

      <BundleUploadTrackingCard
        group={group}
        sellerWallet={sellerWallet}
        onSubmitted={onTrackingUploaded}
      />
    </article>
  );
}
