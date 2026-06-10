"use client";

import Link from "next/link";

import FiatValue from "@/components/ui/FiatValue";
import type { SellerInsights as SellerInsightsData } from "@/lib/transactions";

export default function SellerInsights({
  insights,
}: {
  insights: SellerInsightsData;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Average sale price
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {insights.averageSalePrice.toFixed(4)} SOL
        </p>
        <div className="mt-0.5">
          <FiatValue solAmount={insights.averageSalePrice} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Dispute rate
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {insights.disputeRate.toFixed(1)}%
        </p>
        <p className="mt-1 text-xs text-muted">
          of transactions in this period
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Best performing listing
        </p>
        {insights.bestListing ? (
          <>
            <Link
              href={`/auction/${insights.bestListing.auctionId}`}
              className="mt-2 block truncate text-sm font-semibold text-white hover:text-accent"
              title={insights.bestListing.title}
            >
              {insights.bestListing.title}
            </Link>
            <p className="mt-1 text-sm text-purple-300">
              {insights.bestListing.totalSol.toFixed(4)} SOL earned
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">—</p>
        )}
      </div>
    </section>
  );
}
