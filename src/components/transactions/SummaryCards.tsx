"use client";

import FiatValue from "@/components/ui/FiatValue";
import type {
  BuyerSummary,
  SellerSummary,
  TransactionRole,
  TrendMetric,
} from "@/lib/transactions";

function TrendIndicator({ metric }: { metric: TrendMetric }) {
  if (metric.percentChange === null || metric.direction === "flat") {
    return <span className="text-xs text-muted">—</span>;
  }

  const isUp = metric.direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? "text-emerald-400" : "text-red-400"
      }`}
    >
      <span aria-hidden>{isUp ? "↑" : "↓"}</span>
      {Math.abs(metric.percentChange).toFixed(1)}%
    </span>
  );
}

function SummaryCard({
  label,
  solAmount,
  metric,
  accent,
  suffix,
}: {
  label: string;
  solAmount: number;
  metric: TrendMetric;
  accent: "purple" | "blue";
  suffix?: string;
}) {
  const borderAccent =
    accent === "purple" ? "hover:border-accent/40" : "hover:border-blue-500/40";

  return (
    <div
      className={`rounded-xl border border-border bg-surface px-4 py-4 transition-colors ${borderAccent}`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">
        {solAmount.toFixed(4)} SOL
      </p>
      <div className="mt-0.5">
        <FiatValue solAmount={solAmount} />
      </div>
      {suffix && (
        <p className="mt-1 text-xs text-muted">{suffix}</p>
      )}
      <div className="mt-2">
        <TrendIndicator metric={metric} />
        <span className="ml-1 text-[10px] text-muted">vs prev. period</span>
      </div>
    </div>
  );
}

export default function SummaryCards({
  role,
  sellerSummary,
  buyerSummary,
}: {
  role: TransactionRole;
  sellerSummary: SellerSummary;
  buyerSummary: BuyerSummary;
}) {
  const accent = role === "selling" ? "purple" : "blue";

  if (role === "selling") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total earned"
          solAmount={sellerSummary.totalEarned.current}
          metric={sellerSummary.totalEarned}
          accent={accent}
        />
        <SummaryCard
          label="Pending escrow"
          solAmount={sellerSummary.pendingEscrow.current}
          metric={sellerSummary.pendingEscrow}
          accent={accent}
          suffix={`${sellerSummary.pendingOrderCount} order${sellerSummary.pendingOrderCount === 1 ? "" : "s"}`}
        />
        <SummaryCard
          label="Platform fees paid"
          solAmount={sellerSummary.platformFees.current}
          metric={sellerSummary.platformFees}
          accent={accent}
        />
        <SummaryCard
          label="Total refunded"
          solAmount={sellerSummary.totalRefunded.current}
          metric={sellerSummary.totalRefunded}
          accent={accent}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Total spent"
        solAmount={buyerSummary.totalSpent.current}
        metric={buyerSummary.totalSpent}
        accent={accent}
      />
      <SummaryCard
        label="Pending"
        solAmount={buyerSummary.pending.current}
        metric={buyerSummary.pending}
        accent={accent}
        suffix={`${buyerSummary.pendingOrderCount} order${buyerSummary.pendingOrderCount === 1 ? "" : "s"}`}
      />
      <SummaryCard
        label="Total refunded"
        solAmount={buyerSummary.totalRefunded.current}
        metric={buyerSummary.totalRefunded}
        accent={accent}
      />
      <div className="rounded-xl border border-border bg-surface px-4 py-4 transition-colors hover:border-blue-500/40">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Purchases completed
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {buyerSummary.purchasesCompleted.current}
        </p>
        <div className="mt-2">
          <TrendIndicator metric={buyerSummary.purchasesCompleted} />
          <span className="ml-1 text-[10px] text-muted">vs prev. period</span>
        </div>
      </div>
    </div>
  );
}
