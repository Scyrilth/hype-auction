"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type {
  CategoryBreakdownPoint,
  StatusBreakdownPoint,
  TimeSeriesPoint,
  TransactionRole,
} from "@/lib/transactions";

const TransactionCharts = dynamic(
  () => import("@/components/transactions/TransactionCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl border border-border bg-surface"
          />
        ))}
      </div>
    ),
  }
);

export default function ChartsSection({
  role,
  solPrice,
  earningsSeries,
  volumeSeries,
  categoryBreakdown,
  statusBreakdown,
}: {
  role: TransactionRole;
  solPrice: number;
  earningsSeries: TimeSeriesPoint[];
  volumeSeries: TimeSeriesPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  statusBreakdown: StatusBreakdownPoint[];
}) {
  const [currency, setCurrency] = useState<"SOL" | "USD">("SOL");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Charts</h2>
        <div className="inline-flex rounded-full border border-border bg-surface-elevated p-1">
          {(["SOL", "USD"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setCurrency(unit)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currency === unit
                  ? role === "selling"
                    ? "bg-accent text-white"
                    : "bg-blue-600 text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <TransactionCharts
        role={role}
        currency={currency}
        solPrice={solPrice}
        earningsSeries={earningsSeries}
        volumeSeries={volumeSeries}
        categoryBreakdown={categoryBreakdown}
        statusBreakdown={statusBreakdown}
      />
    </section>
  );
}
