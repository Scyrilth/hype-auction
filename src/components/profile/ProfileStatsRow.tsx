import FiatValue from "@/components/ui/FiatValue";
import type { BuyerProfileStats } from "@/lib/profile";
import { formatSol } from "@/lib/format";

function StatCard({
  label,
  value,
  fiatSolAmount,
}: {
  label: string;
  value: string;
  fiatSolAmount?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {fiatSolAmount !== undefined && (
        <div className="mt-0.5">
          <FiatValue solAmount={fiatSolAmount} showTooltip={false} />
        </div>
      )}
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
      <StatCard
        label="Total Spent"
        value={formatSol(stats.totalSpent)}
        fiatSolAmount={stats.totalSpent}
      />
      <StatCard label="Reviews Given" value={String(stats.reviewsGiven)} />
    </div>
  );
}
