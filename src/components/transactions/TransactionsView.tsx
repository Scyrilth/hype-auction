"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ChartsSection from "@/components/transactions/ChartsSection";
import DateRangeSelector from "@/components/transactions/DateRangeSelector";
import RoleToggle from "@/components/transactions/RoleToggle";
import SellerInsights from "@/components/transactions/SellerInsights";
import StatusPills from "@/components/transactions/StatusPills";
import SummaryCards from "@/components/transactions/SummaryCards";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionsSkeleton from "@/components/transactions/TransactionsSkeleton";
import { DEFAULT_USER_ERROR_MESSAGE } from "@/lib/errors";
import { useSolPrice } from "@/hooks/useSolPrice";
import {
  buildBuyerSpendingSeries,
  buildBuyerStatusBreakdown,
  buildBuyerVolumeSeries,
  buildCategoryBreakdown,
  buildSellerEarningsSeries,
  buildSellerStatusBreakdown,
  buildSellerVolumeSeries,
  computeBuyerSummary,
  computeSellerInsights,
  computeSellerSummary,
  countBuyerByStatus,
  countSellerByStatus,
  exportBuyerCsv,
  exportSellerCsv,
  exportTransactionsPdf,
  filterBuyerRows,
  filterSellerRows,
  getDateRangeFromPreset,
  getPreviousPeriod,
  type BuyerStatusFilter,
  type BuyerSummary,
  type DateRange,
  type SellerStatusFilter,
  type SellerSummary,
  type TransactionRole,
  type TransactionsData,
} from "@/lib/transactions";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

const EMPTY_SELLER_SUMMARY: SellerSummary = {
  totalEarned: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  pendingEscrow: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  platformFees: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  totalRefunded: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  pendingOrderCount: 0,
};

const EMPTY_BUYER_SUMMARY: BuyerSummary = {
  totalSpent: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  pending: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  totalRefunded: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  purchasesCompleted: { current: 0, previous: 0, percentChange: null, direction: "flat" },
  pendingOrderCount: 0,
};

export default function TransactionsView() {
  const { publicKey } = useWallet();
  const searchParams = useSearchParams();
  const { solPrice } = useSolPrice();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TransactionsData | null>(null);
  const [range, setRange] = useState<DateRange>(() =>
    getDateRangeFromPreset("all")
  );
  const [role, setRole] = useState<TransactionRole>("selling");
  const [statusFilter, setStatusFilter] = useState<
    SellerStatusFilter | BuyerStatusFilter
  >("all");
  const [roleInitialized, setRoleInitialized] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const wallet = publicKey?.toBase58() ?? "";
  const rate = solPrice ?? 132.5;

  const loadData = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/transactions?rate=${encodeURIComponent(String(rate))}`,
        {
          headers: {
            "x-wallet-address": wallet,
            ...getWalletAuthHeaders(),
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }
      const result = (await response.json()) as TransactionsData;
      setData(result);
    } catch (err) {
      console.error("TransactionsView: load failed", err);
      setError(DEFAULT_USER_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [wallet, rate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data || roleInitialized) return;

    const modeParam = searchParams.get("mode");
    if (modeParam === "buying") {
      setRole("buying");
    } else if (data.hasSellerListings) {
      setRole("selling");
    } else if (data.buyerRows.length > 0) {
      setRole("buying");
    }
    setRoleInitialized(true);
  }, [data, searchParams, roleInitialized]);

  useEffect(() => {
    setStatusFilter("all");
  }, [role, range]);

  const showRoleToggle = useMemo(() => {
    if (!data) return false;
    return data.hasSellerListings && data.buyerRows.length > 0;
  }, [data]);

  const previousRange = useMemo(() => getPreviousPeriod(range), [range]);

  const filteredSellerRows = useMemo(() => {
    if (!data) return [];
    let rows = filterSellerRows(data.sellerRows, range);
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.displayStatus === statusFilter);
    }
    return rows;
  }, [data, range, statusFilter]);

  const filteredBuyerRows = useMemo(() => {
    if (!data) return [];
    let rows = filterBuyerRows(data.buyerRows, range);
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.displayStatus === statusFilter);
    }
    return rows;
  }, [data, range, statusFilter]);

  const rangeSellerRows = useMemo(
    () => (data ? filterSellerRows(data.sellerRows, range) : []),
    [data, range]
  );

  const rangeBuyerRows = useMemo(
    () => (data ? filterBuyerRows(data.buyerRows, range) : []),
    [data, range]
  );

  const prevSellerRows = useMemo(
    () => (data ? filterSellerRows(data.sellerRows, previousRange) : []),
    [data, previousRange]
  );

  const prevBuyerRows = useMemo(
    () => (data ? filterBuyerRows(data.buyerRows, previousRange) : []),
    [data, previousRange]
  );

  const sellerSummary = useMemo(
    () =>
      data
        ? computeSellerSummary(rangeSellerRows, prevSellerRows)
        : EMPTY_SELLER_SUMMARY,
    [data, rangeSellerRows, prevSellerRows]
  );

  const buyerSummary = useMemo(
    () =>
      data
        ? computeBuyerSummary(rangeBuyerRows, prevBuyerRows)
        : EMPTY_BUYER_SUMMARY,
    [data, rangeBuyerRows, prevBuyerRows]
  );

  const sellerInsights = useMemo(
    () => computeSellerInsights(rangeSellerRows),
    [rangeSellerRows]
  );

  const statusCounts = useMemo(() => {
    if (role === "selling") return countSellerByStatus(rangeSellerRows);
    return countBuyerByStatus(rangeBuyerRows);
  }, [role, rangeSellerRows, rangeBuyerRows]);

  const chartData = useMemo(() => {
    if (role === "selling") {
      return {
        earnings: buildSellerEarningsSeries(rangeSellerRows, range),
        volume: buildSellerVolumeSeries(rangeSellerRows, range),
        category: buildCategoryBreakdown(
          rangeSellerRows
            .filter((r) => r.displayStatus === "released")
            .map((r) => ({ category: r.category, valueSol: r.amounts.netSol }))
        ),
        status: buildSellerStatusBreakdown(rangeSellerRows),
      };
    }

    return {
      earnings: buildBuyerSpendingSeries(rangeBuyerRows, range),
      volume: buildBuyerVolumeSeries(rangeBuyerRows, range),
      category: buildCategoryBreakdown(
        rangeBuyerRows
          .filter((r) => r.displayStatus === "completed")
          .map((r) => ({ category: r.category, valueSol: r.amounts.totalSol }))
      ),
      status: buildBuyerStatusBreakdown(rangeBuyerRows),
    };
  }, [role, rangeSellerRows, rangeBuyerRows, range]);

  const handleExportCsv = () => {
    if (role === "selling") {
      exportSellerCsv(filteredSellerRows);
    } else {
      exportBuyerCsv(filteredBuyerRows);
    }
  };

  const handleExportPdf = async () => {
    setPdfGenerating(true);
    try {
      await exportTransactionsPdf({
        role,
        range,
        summary: role === "selling" ? sellerSummary : buyerSummary,
        rows: role === "selling" ? filteredSellerRows : filteredBuyerRows,
        currentSolUsdRate: rate,
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) return <TransactionsSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-live-red/30 bg-live-red/10 px-6 py-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadData()}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const subtitle =
    role === "selling"
      ? showRoleToggle
        ? "Seller"
        : "Seller"
      : showRoleToggle
        ? "Buyer"
        : "Buyer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Transaction History</h1>
          <p
            className={`mt-1 text-sm ${
              role === "selling" ? "text-purple-300" : "text-blue-300"
            }`}
          >
            {subtitle}
          </p>
        </div>
        {showRoleToggle && (
          <RoleToggle role={role} onChange={setRole} />
        )}
      </div>

      <DateRangeSelector range={range} onChange={setRange} />

      <p className="text-xs text-muted">
        Current SOL/USD rate: ${rate.toFixed(2)}. Historical transaction values
        use the rate stored at payment time where available.
      </p>

      <SummaryCards
        role={role}
        sellerSummary={sellerSummary}
        buyerSummary={buyerSummary}
      />

      <ChartsSection
        role={role}
        solPrice={rate}
        earningsSeries={chartData.earnings}
        volumeSeries={chartData.volume}
        categoryBreakdown={chartData.category}
        statusBreakdown={chartData.status}
      />

      <StatusPills
        role={role}
        active={statusFilter}
        counts={statusCounts}
        onChange={setStatusFilter}
      />

      <TransactionTable
        role={role}
        sellerRows={filteredSellerRows}
        buyerRows={filteredBuyerRows}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        pdfGenerating={pdfGenerating}
      />

      {role === "selling" && <SellerInsights insights={sellerInsights} />}
    </div>
  );
}
