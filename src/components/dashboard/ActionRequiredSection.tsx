"use client";

import { useCallback, useEffect, useState } from "react";

import UnpaidAuctionCard from "@/components/dashboard/UnpaidAuctionCard";
import {
  fetchUnpaidAuctionActions,
  syncExpiredNextBidderOffers,
  type UnpaidAuctionAction,
} from "@/lib/non-payment-resolution";
import { getErrorMessage } from "@/lib/errors";

export default function ActionRequiredSection({
  sellerWallet,
  onRefresh,
}: {
  sellerWallet: string;
  onRefresh?: () => void;
}) {
  const [actions, setActions] = useState<UnpaidAuctionAction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[ActionRequiredSection] loading for seller:", sellerWallet);
      await syncExpiredNextBidderOffers();
      const items = await fetchUnpaidAuctionActions(sellerWallet);
      console.log("[ActionRequiredSection] fetched actions:", items);
      setActions(items);
    } catch (error) {
      console.error("[ActionRequiredSection] load failed:", getErrorMessage(error));
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [sellerWallet]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !actions.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-white">Action Required</h2>
        <p className="mt-1 text-sm text-muted">
          These auctions need your decision after a buyer failed to pay.
        </p>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <UnpaidAuctionCard
            key={action.auction.id}
            action={action}
            sellerWallet={sellerWallet}
            onRefresh={() => {
              void load();
              onRefresh?.();
            }}
          />
        ))}
      </div>
    </section>
  );
}
