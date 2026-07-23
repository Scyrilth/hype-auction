"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import DashboardProfileSummary from "@/components/dashboard/DashboardProfileSummary";
import ActionRequiredSection from "@/components/dashboard/ActionRequiredSection";
import OrdersNeedingActionSection from "@/components/dashboard/OrdersNeedingActionSection";
import BundleRefundNudgeSection from "@/components/dashboard/BundleRefundNudgeSection";
import SellerSetupBanner from "@/components/dashboard/SellerSetupBanner";
import DashboardTabs, {
  DashboardActivityFeed,
} from "@/components/dashboard/DashboardTabs";
import { checkAndEndExpiredAuctions } from "@/lib/auction-lifecycle";
import { getSellerDashboardData, type SellerDashboardData } from "@/lib/dashboard";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { logSupabaseError } from "@/lib/errors";

const emptyData: SellerDashboardData = {
  profile: null,
  shopSlug: "",
  stats: {
    totalListings: 0,
    activeAuctions: 0,
    totalBidsReceived: 0,
    totalVolume: 0,
    followers: 0,
    averageRating: 0,
  },
  activeAuctions: [],
  pastAuctions: [],
  bidsReceived: [],
  reviews: [],
  activity: [],
};

export default function DashboardView() {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const [data, setData] = useState<SellerDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      await checkAndEndExpiredAuctions();
      const dashboard = await getSellerDashboardData(publicKey.toBase58(), client);
      setData(dashboard);
    } catch (error) {
      logSupabaseError("DashboardView", error);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, [client, publicKey]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!publicKey) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-sm text-muted">
        Loading dashboard...
      </div>
    );
  }

  const showSellerBanner =
    !data.profile?.country?.trim() && data.stats.totalListings === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DashboardProfileSummary
        profile={data.profile}
        walletAddress={publicKey.toBase58()}
        stats={data.stats}
      />

      {showSellerBanner && (
        <SellerSetupBanner walletAddress={publicKey.toBase58()} />
      )}

      <ActionRequiredSection
        sellerWallet={publicKey.toBase58()}
        onRefresh={loadDashboard}
      />

      <OrdersNeedingActionSection sellerWallet={publicKey.toBase58()} />

      <BundleRefundNudgeSection sellerWallet={publicKey.toBase58()} />

      <DashboardTabs
        activeAuctions={data.activeAuctions}
        pastAuctions={data.pastAuctions}
        bidsReceived={data.bidsReceived}
        reviews={data.reviews}
        vendorWallet={publicKey.toBase58()}
        onRefresh={loadDashboard}
      />

      <DashboardActivityFeed activity={data.activity} />
    </div>
  );
}
