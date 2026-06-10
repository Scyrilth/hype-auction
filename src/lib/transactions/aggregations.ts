import {
  formatPeriodLabel,
  getChartGranularity,
  getPeriodKey,
  isDateInRange,
} from "./date-range";
import type {
  BuyerSummary,
  BuyerTransactionRow,
  CategoryBreakdownPoint,
  DateRange,
  SellerInsights,
  SellerSummary,
  SellerTransactionRow,
  StatusBreakdownPoint,
  TimeSeriesPoint,
  TrendMetric,
} from "./types";
import {
  BUYER_STATUS_LABELS,
  SELLER_STATUS_LABELS,
} from "./status";

function buildTrend(current: number, previous: number): TrendMetric {
  if (previous === 0) {
    return {
      current,
      previous,
      percentChange: current > 0 ? 100 : null,
      direction: current > 0 ? "up" : "flat",
    };
  }

  const percentChange = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    percentChange,
    direction:
      percentChange > 0.5 ? "up" : percentChange < -0.5 ? "down" : "flat",
  };
}

export function filterSellerRows(
  rows: SellerTransactionRow[],
  range: DateRange
): SellerTransactionRow[] {
  return rows.filter((row) => isDateInRange(row.date, range));
}

export function filterBuyerRows(
  rows: BuyerTransactionRow[],
  range: DateRange
): BuyerTransactionRow[] {
  return rows.filter((row) => isDateInRange(row.date, range));
}

export function computeSellerSummary(
  rows: SellerTransactionRow[],
  previousRows: SellerTransactionRow[]
): SellerSummary {
  const released = rows.filter((r) => r.displayStatus === "released");
  const pending = rows.filter((r) => r.displayStatus === "funded");
  const refunded = rows.filter((r) => r.displayStatus === "refunded");

  const prevReleased = previousRows.filter((r) => r.displayStatus === "released");
  const prevPending = previousRows.filter((r) => r.displayStatus === "funded");
  const prevRefunded = previousRows.filter((r) => r.displayStatus === "refunded");

  const totalEarned = released.reduce((s, r) => s + r.amounts.netSol, 0);
  const prevEarned = prevReleased.reduce((s, r) => s + r.amounts.netSol, 0);

  const pendingEscrow = pending.reduce((s, r) => s + r.amounts.totalSol, 0);
  const prevPendingEscrow = prevPending.reduce((s, r) => s + r.amounts.totalSol, 0);

  const platformFees = released.reduce((s, r) => s + r.amounts.feeSol, 0);
  const prevFees = prevReleased.reduce((s, r) => s + r.amounts.feeSol, 0);

  const totalRefunded = refunded.reduce((s, r) => s + r.amounts.totalSol, 0);
  const prevTotalRefunded = prevRefunded.reduce((s, r) => s + r.amounts.totalSol, 0);

  return {
    totalEarned: buildTrend(totalEarned, prevEarned),
    pendingEscrow: buildTrend(pendingEscrow, prevPendingEscrow),
    platformFees: buildTrend(platformFees, prevFees),
    totalRefunded: buildTrend(totalRefunded, prevTotalRefunded),
    pendingOrderCount: pending.length,
  };
}

export function computeBuyerSummary(
  rows: BuyerTransactionRow[],
  previousRows: BuyerTransactionRow[]
): BuyerSummary {
  const completed = rows.filter((r) => r.displayStatus === "completed");
  const pending = rows.filter((r) => r.displayStatus === "pending");
  const refunded = rows.filter((r) => r.displayStatus === "refunded");

  const prevCompleted = previousRows.filter((r) => r.displayStatus === "completed");
  const prevPending = previousRows.filter((r) => r.displayStatus === "pending");
  const prevRefunded = previousRows.filter((r) => r.displayStatus === "refunded");

  const totalSpent = completed.reduce((s, r) => s + r.amounts.totalSol, 0);
  const prevSpent = prevCompleted.reduce((s, r) => s + r.amounts.totalSol, 0);

  const pendingTotal = pending.reduce((s, r) => s + r.amounts.totalSol, 0);
  const prevPendingTotal = prevPending.reduce((s, r) => s + r.amounts.totalSol, 0);

  const totalRefunded = refunded.reduce((s, r) => s + r.amounts.totalSol, 0);
  const prevTotalRefunded = prevRefunded.reduce((s, r) => s + r.amounts.totalSol, 0);

  return {
    totalSpent: buildTrend(totalSpent, prevSpent),
    pending: buildTrend(pendingTotal, prevPendingTotal),
    totalRefunded: buildTrend(totalRefunded, prevTotalRefunded),
    purchasesCompleted: buildTrend(completed.length, prevCompleted.length),
    pendingOrderCount: pending.length,
  };
}

function buildTimeSeries(
  rows: { date: string; valueSol: number }[],
  range: DateRange
): TimeSeriesPoint[] {
  const granularity = getChartGranularity(range);
  const buckets = new Map<string, TimeSeriesPoint>();

  for (const row of rows) {
    const date = new Date(row.date);
    const key = getPeriodKey(date, granularity);
    const existing = buckets.get(key);
    if (existing) {
      existing.value += row.valueSol;
      existing.count += 1;
    } else {
      buckets.set(key, {
        label: formatPeriodLabel(date, granularity),
        timestamp: date.getTime(),
        value: row.valueSol,
        count: 1,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function buildSellerEarningsSeries(
  rows: SellerTransactionRow[],
  range: DateRange
): TimeSeriesPoint[] {
  return buildTimeSeries(
    rows
      .filter((r) => r.displayStatus === "released")
      .map((r) => ({ date: r.date, valueSol: r.amounts.netSol })),
    range
  );
}

export function buildSellerVolumeSeries(
  rows: SellerTransactionRow[],
  range: DateRange
): TimeSeriesPoint[] {
  return buildTimeSeries(
    rows
      .filter((r) => r.displayStatus === "released")
      .map((r) => ({ date: r.date, valueSol: 1 })),
    range
  );
}

export function buildBuyerSpendingSeries(
  rows: BuyerTransactionRow[],
  range: DateRange
): TimeSeriesPoint[] {
  return buildTimeSeries(
    rows
      .filter((r) => r.displayStatus === "completed")
      .map((r) => ({ date: r.date, valueSol: r.amounts.totalSol })),
    range
  );
}

export function buildBuyerVolumeSeries(
  rows: BuyerTransactionRow[],
  range: DateRange
): TimeSeriesPoint[] {
  return buildTimeSeries(
    rows
      .filter((r) => r.displayStatus === "completed")
      .map((r) => ({ date: r.date, valueSol: 1 })),
    range
  );
}

export function buildCategoryBreakdown(
  rows: { category: string | null; valueSol: number }[]
): CategoryBreakdownPoint[] {
  const totals = new Map<string, { valueSol: number; count: number }>();

  for (const row of rows) {
    const category = row.category?.trim() || "Uncategorized";
    const existing = totals.get(category) ?? { valueSol: 0, count: 0 };
    existing.valueSol += row.valueSol;
    existing.count += 1;
    totals.set(category, existing);
  }

  const grandTotal = [...totals.values()].reduce((s, v) => s + v.valueSol, 0);

  return [...totals.entries()]
    .map(([category, data]) => ({
      category,
      valueSol: data.valueSol,
      count: data.count,
      percent: grandTotal > 0 ? (data.valueSol / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.valueSol - a.valueSol);
}

export function buildSellerStatusBreakdown(
  rows: SellerTransactionRow[]
): StatusBreakdownPoint[] {
  const statuses = ["released", "funded", "refunded", "disputed"] as const;
  return statuses.map((status) => {
    const matching = rows.filter((r) => r.displayStatus === status);
    return {
      status: SELLER_STATUS_LABELS[status],
      count: matching.length,
      valueSol: matching.reduce((s, r) => s + r.amounts.totalSol, 0),
    };
  });
}

export function buildBuyerStatusBreakdown(
  rows: BuyerTransactionRow[]
): StatusBreakdownPoint[] {
  const statuses = ["completed", "pending", "refunded"] as const;
  return statuses.map((status) => {
    const matching = rows.filter((r) => r.displayStatus === status);
    return {
      status: BUYER_STATUS_LABELS[status],
      count: matching.length,
      valueSol: matching.reduce((s, r) => s + r.amounts.totalSol, 0),
    };
  });
}

export function computeSellerInsights(
  rows: SellerTransactionRow[]
): SellerInsights {
  const released = rows.filter((r) => r.displayStatus === "released");
  const disputed = rows.filter((r) => r.displayStatus === "disputed");

  const averageSalePrice =
    released.length > 0
      ? released.reduce((s, r) => s + r.amounts.netSol, 0) / released.length
      : 0;

  const disputeRate =
    rows.length > 0 ? (disputed.length / rows.length) * 100 : 0;

  const listingTotals = new Map<
    string,
    { title: string; totalSol: number; auctionId: string }
  >();

  for (const row of released) {
    const key = row.auctionId;
    const existing = listingTotals.get(key);
    if (existing) {
      existing.totalSol += row.amounts.netSol;
    } else {
      listingTotals.set(key, {
        title: row.itemTitle,
        totalSol: row.amounts.netSol,
        auctionId: row.auctionId,
      });
    }
  }

  const bestListing =
    [...listingTotals.values()].sort((a, b) => b.totalSol - a.totalSol)[0] ??
    null;

  return { averageSalePrice, disputeRate, bestListing };
}

export function countSellerByStatus(
  rows: SellerTransactionRow[]
): Record<string, number> {
  return {
    all: rows.length,
    released: rows.filter((r) => r.displayStatus === "released").length,
    funded: rows.filter((r) => r.displayStatus === "funded").length,
    refunded: rows.filter((r) => r.displayStatus === "refunded").length,
    disputed: rows.filter((r) => r.displayStatus === "disputed").length,
  };
}

export function countBuyerByStatus(
  rows: BuyerTransactionRow[]
): Record<string, number> {
  return {
    all: rows.length,
    completed: rows.filter((r) => r.displayStatus === "completed").length,
    pending: rows.filter((r) => r.displayStatus === "pending").length,
    refunded: rows.filter((r) => r.displayStatus === "refunded").length,
  };
}
