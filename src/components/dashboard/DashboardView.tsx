"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import DashboardProfileSummary from "@/components/dashboard/DashboardProfileSummary";
import DashboardTabs, {
  DashboardActivityFeed,
} from "@/components/dashboard/DashboardTabs";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { getSellerDashboardData, type SellerDashboardData } from "@/lib/dashboard";

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
  const [data, setData] = useState<SellerDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const dashboard = await getSellerDashboardData(publicKey.toBase58());
      setData(dashboard);
    } catch (error) {
      logSupabaseError("DashboardView", error);
      console.error(getErrorMessage(error));
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DashboardProfileSummary
        profile={data.profile}
        shopSlug={data.shopSlug}
        walletAddress={publicKey.toBase58()}
        stats={data.stats}
      />

      <DashboardTabs
        activeAuctions={data.activeAuctions}
        pastAuctions={data.pastAuctions}
        bidsReceived={data.bidsReceived}
        reviews={data.reviews}
        shopSlug={data.shopSlug}
        onRefresh={loadDashboard}
      />

      <DashboardActivityFeed activity={data.activity} />
    </div>
  );
}
