"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

import FiatValue from "@/components/ui/FiatValue";
import { useSolPrice } from "@/hooks/useSolPrice";
import { fetchAdminOverview } from "@/lib/admin/data";
import { shortenAddress } from "@/lib/format";
import { getProfileSlug } from "@/lib/profile-links";

import { useAdminContext } from "./AdminContext";

const AdminOverviewCharts = dynamic(
  () => import("@/components/admin/AdminOverviewCharts"),
  { ssr: false, loading: () => <div className="h-56 animate-pulse rounded-xl bg-surface" /> }
);

export default function AdminOverview() {
  const { showDummyData } = useAdminContext();
  const { solPrice } = useSolPrice();
  const rate = solPrice ?? 132.5;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminOverview>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminOverview(showDummyData, rate)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDummyData, rate]);

  if (loading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total GMV", sol: data.stats.totalGmvSol },
    { label: "Active listings", value: String(data.stats.activeListings) },
    { label: "Total users", value: String(data.stats.totalUsers) },
    { label: "Dispute rate", value: `${data.stats.disputeRate.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface px-4 py-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              {card.label}
            </p>
            {card.sol !== undefined ? (
              <>
                <p className="mt-2 text-lg font-semibold text-white">
                  {card.sol.toFixed(4)} SOL
                </p>
                <FiatValue solAmount={card.sol} />
              </>
            ) : (
              <p className="mt-2 text-lg font-semibold text-white">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <AdminOverviewCharts
        gmvByMonth={data.gmvByMonth}
        usersByMonth={data.usersByMonth}
        categoryGmv={data.categoryGmv}
        statusCounts={data.statusCounts}
        solUsdRate={rate}
        showDummyData={showDummyData}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Top vendors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2">Vendor</th>
                  <th className="pb-2">Sales</th>
                  <th className="pb-2">Volume</th>
                  <th className="pb-2">Dispute %</th>
                </tr>
              </thead>
              <tbody>
                {data.topVendors.map((v) => (
                  <tr key={v.wallet} className="border-t border-border/60">
                    <td className="py-2">
                      <Link
                        href={`/shop/${getProfileSlug(v.username, v.wallet)}`}
                        className="text-purple-300 underline decoration-purple-500/50 underline-offset-2 hover:text-purple-200"
                      >
                        {v.username ? `@${v.username}` : shortenAddress(v.wallet, 6)}
                      </Link>
                    </td>
                    <td className="py-2">{v.salesCount}</td>
                    <td className="py-2">{v.volumeSol.toFixed(2)} SOL</td>
                    <td className="py-2">{v.disputeRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Top categories</h3>
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="pb-2">Category</th>
                <th className="pb-2">Listings</th>
                <th className="pb-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {data.topCategories.slice(0, 10).map((c) => (
                <tr key={c.category} className="border-t border-border/60">
                  <td className="py-2">
                    <Link
                      href={`/browse?category=${encodeURIComponent(c.category)}`}
                      className="text-purple-300 underline decoration-purple-500/50 underline-offset-2 hover:text-purple-200"
                    >
                      {c.category}
                    </Link>
                  </td>
                  <td className="py-2">{c.listingCount}</td>
                  <td className="py-2">{c.volumeSol.toFixed(2)} SOL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
