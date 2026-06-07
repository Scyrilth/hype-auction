"use client";

import { useEffect } from "react";

import FiatValue from "@/components/ui/FiatValue";
import { useSolPrice } from "@/hooks/useSolPrice";
import type { BuyerProfileStats } from "@/lib/profile";
import { formatSol } from "@/lib/format";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function TotalSpentStatCard({ totalSpent }: { totalSpent: number }) {
  const { solPrice, loading } = useSolPrice();

  useEffect(() => {
    console.log("[ProfileStats] Total Spent — solPrice:", solPrice, "loading:", loading);
  }, [solPrice, loading]);

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted">Total Spent</p>
      <p className="mt-1 text-lg font-bold text-white">{formatSol(totalSpent)}</p>
      <div className="mt-0.5">
        <FiatValue solAmount={totalSpent} showTooltip={true} />
      </div>
    </div>
  );
}

export default function ProfileStatsRow({ stats }: { stats: BuyerProfileStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total Bids Placed"
        value={String(stats.totalBidsPlaced)}
      />
      <StatCard label="Auctions Won" value={String(stats.auctionsWon)} />
      <TotalSpentStatCard totalSpent={stats.totalSpent} />
      <StatCard label="Reviews Given" value={String(stats.reviewsGiven)} />
    </div>
  );
}
