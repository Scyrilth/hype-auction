"use client";

import Image from "next/image";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { formatPaidAgo, truncateWalletAddress } from "@/lib/format";
import { getOrderThumbnail } from "@/lib/seller-orders";
import type { PendingShipmentGroup } from "@/lib/shipment-groups";

export default function PendingBundleGroupCard({
  group,
}: {
  group: PendingShipmentGroup;
}) {
  const waitingLabel = formatPaidAgo(group.urgencyAt);
  const previewOrders = group.orders.slice(0, 3);
  const remainingCount = group.orders.length - previewOrders.length;

  return (
    <article className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-amber-100">
              Bundled — tracking pending
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {group.orders.length} items for{" "}
              {truncateWalletAddress(group.buyerWallet)}
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
                </li>
              );
            })}
            {remainingCount > 0 && (
              <li className="text-xs text-muted">+{remainingCount} more</li>
            )}
          </ul>
        </div>

        <span className="shrink-0 rounded-full border border-amber-500/40 px-4 py-2 text-center text-sm font-medium text-amber-100">
          Awaiting tracking
        </span>
      </div>
    </article>
  );
}
