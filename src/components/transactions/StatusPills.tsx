"use client";

import type {
  BuyerStatusFilter,
  SellerStatusFilter,
  TransactionRole,
} from "@/lib/transactions";
import { BUYER_STATUS_LABELS, SELLER_STATUS_LABELS } from "@/lib/transactions";

const SELLER_PILLS: { id: SellerStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "released", label: SELLER_STATUS_LABELS.released },
  { id: "funded", label: SELLER_STATUS_LABELS.funded },
  { id: "refunded", label: SELLER_STATUS_LABELS.refunded },
  { id: "disputed", label: SELLER_STATUS_LABELS.disputed },
];

const BUYER_PILLS: { id: BuyerStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "completed", label: BUYER_STATUS_LABELS.completed },
  { id: "pending", label: BUYER_STATUS_LABELS.pending },
  { id: "refunded", label: BUYER_STATUS_LABELS.refunded },
];

export default function StatusPills({
  role,
  active,
  counts,
  onChange,
}: {
  role: TransactionRole;
  active: SellerStatusFilter | BuyerStatusFilter;
  counts: Record<string, number>;
  onChange: (status: SellerStatusFilter | BuyerStatusFilter) => void;
}) {
  const pills = role === "selling" ? SELLER_PILLS : BUYER_PILLS;
  const activeAccent =
    role === "selling"
      ? "bg-accent/20 text-purple-200 border-accent/40"
      : "bg-blue-600/20 text-blue-200 border-blue-500/40";

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          onClick={() => onChange(pill.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            active === pill.id
              ? activeAccent
              : "border-border bg-surface-elevated text-muted hover:border-accent/30 hover:text-white"
          }`}
        >
          {pill.label}
          <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px]">
            {counts[pill.id] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
