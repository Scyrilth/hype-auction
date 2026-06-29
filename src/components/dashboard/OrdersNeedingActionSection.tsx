"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import {
  fetchSellerOrdersNeedingAction,
  getOrderThumbnail,
  type SellerOrderNeedingAction,
} from "@/lib/seller-orders";

export default function OrdersNeedingActionSection({
  sellerWallet,
}: {
  sellerWallet: string;
}) {
  const [orders, setOrders] = useState<SellerOrderNeedingAction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchSellerOrdersNeedingAction(sellerWallet);
      setOrders(items);
    } catch (error) {
      console.error("[OrdersNeedingActionSection] load failed:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [sellerWallet]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !orders.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-white">Orders Needing Action</h2>
        <p className="mt-1 text-sm text-muted">
          Ship paid orders or respond to open disputes.
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const thumb = getOrderThumbnail(order.title, order.imageUrl, null);

          return (
            <article
              key={order.threadId}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
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
        })}
      </div>
    </section>
  );
}
