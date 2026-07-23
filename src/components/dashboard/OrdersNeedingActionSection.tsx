"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import BundleableOrderGroup from "@/components/dashboard/BundleableOrderGroup";
import PendingBundleGroupCard from "@/components/dashboard/PendingBundleGroupCard";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { formatOpenedAgo } from "@/lib/format";
import {
  fetchSellerOrdersNeedingAction,
  getOrderThumbnail,
  type SellerFulfillmentQueue,
  type SellerOrderNeedingAction,
} from "@/lib/seller-orders";

function DisputeOrderCard({ order }: { order: SellerOrderNeedingAction }) {
  const thumb = getOrderThumbnail(order.title, order.imageUrl, null);
  const waitingLabel = formatOpenedAgo(order.urgencyAt);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
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

function groupShipOrdersByBuyer(
  orders: SellerOrderNeedingAction[]
): Map<string, SellerOrderNeedingAction[]> {
  const groups = new Map<string, SellerOrderNeedingAction[]>();

  for (const order of orders) {
    const existing = groups.get(order.buyerWallet) ?? [];
    existing.push(order);
    groups.set(order.buyerWallet, existing);
  }

  return groups;
}

export default function OrdersNeedingActionSection({
  sellerWallet,
}: {
  sellerWallet: string;
}) {
  const { client } = useSupabaseClient();
  const [queue, setQueue] = useState<SellerFulfillmentQueue>({
    shipOrders: [],
    disputeOrders: [],
    bundledGroupsPending: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchSellerOrdersNeedingAction(sellerWallet, client);
      setQueue(items);
    } catch (error) {
      console.error("[OrdersNeedingActionSection] load failed:", error);
      setQueue({
        shipOrders: [],
        disputeOrders: [],
        bundledGroupsPending: [],
      });
    } finally {
      setLoading(false);
    }
  }, [client, sellerWallet]);

  useEffect(() => {
    void load();
  }, [load]);

  const shipGroups = useMemo(
    () => groupShipOrdersByBuyer(queue.shipOrders),
    [queue.shipOrders]
  );

  const hasItems =
    queue.shipOrders.length > 0 ||
    queue.disputeOrders.length > 0 ||
    queue.bundledGroupsPending.length > 0;

  if (loading || !hasItems) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-white">Orders Needing Action</h2>
        <p className="mt-1 text-sm text-muted">
          Ship paid orders, bundle items for the same buyer, or respond to open
          disputes.
        </p>
      </div>

      <div className="space-y-4">
        {queue.bundledGroupsPending.map((group) => (
          <PendingBundleGroupCard key={group.groupId} group={group} />
        ))}

        {[...shipGroups.entries()].map(([buyerWallet, orders]) => (
          <BundleableOrderGroup
            key={buyerWallet}
            buyerWallet={buyerWallet}
            orders={orders}
            sellerWallet={sellerWallet}
            onBundled={load}
          />
        ))}

        {queue.disputeOrders.map((order) => (
          <DisputeOrderCard key={order.threadId} order={order} />
        ))}
      </div>
    </section>
  );
}
