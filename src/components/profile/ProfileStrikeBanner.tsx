"use client";

import type { BuyerStrikeSummary } from "@/lib/buyer-strikes";

export default function ProfileStrikeBanner({
  summary,
}: {
  summary: BuyerStrikeSummary;
}) {
  if (summary.status === "none") return null;

  if (summary.status === "warning") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        ⚠ You have a warning on your account. Further non-payments may result
        in suspension.
      </div>
    );
  }

  if (summary.status === "suspended") {
    const dateLabel = summary.suspensionExpiresAt
      ? new Date(summary.suspensionExpiresAt).toLocaleDateString()
      : "later";

    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        🚫 Your bidding is suspended until {dateLabel}. You cannot place bids
        during this period.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      🚫 Your account has been permanently banned from bidding. Contact support
      to appeal.
    </div>
  );
}
