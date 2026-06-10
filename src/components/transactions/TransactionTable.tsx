"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PortalInfoTooltip from "@/components/ui/PortalInfoTooltip";
import { useToast } from "@/components/ui/Toast";
import { getExplorerTxUrl } from "@/lib/escrow";
import { shortenAddress } from "@/lib/format";
import type {
  BuyerSortKey,
  BuyerTransactionRow,
  SellerSortKey,
  SellerTransactionRow,
  SortDirection,
  TransactionRole,
} from "@/lib/transactions";
import {
  buyerStatusBadgeClass,
  BUYER_STATUS_LABELS,
  sellerStatusBadgeClass,
  SELLER_STATUS_LABELS,
} from "@/lib/transactions";

const PAGE_SIZE = 20;

const USD_COLUMN_TOOLTIP =
  "USD values use the SOL rate at time of payment where available, otherwise current rate";

function UsdColumnHeader({
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  sortKey: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <SortHeader
        label="~USD"
        sortKey={sortKey}
        activeKey={activeKey}
        direction={direction}
        onSort={onSort}
      />
      <PortalInfoTooltip text={USD_COLUMN_TOOLTIP} multiline />
    </span>
  );
}

function UsdCell({
  row,
}: {
  row: SellerTransactionRow | BuyerTransactionRow;
}) {
  return (
    <div>
      <p>~${row.amounts.usdApprox.toFixed(2)}</p>
      {row.solUsdRateAtPayment != null ? (
        <p className="mt-0.5 text-[10px] text-muted">
          Rate: ${row.solUsdRateAtPayment.toFixed(2)}
          {row.paymentCompletedAt
            ? ` on ${new Date(row.paymentCompletedAt).toLocaleDateString()}`
            : ""}
        </p>
      ) : (
        <p className="mt-0.5 text-[10px] text-muted/60">Rate: ~current</p>
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 text-left text-[10px] font-medium uppercase tracking-wider text-muted hover:text-white"
    >
      {label}
      {active && (
        <span className="text-accent" aria-hidden>
          {direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

function CopyReference({
  reference,
}: {
  reference: string | null;
}) {
  const { showToast } = useToast();
  const display = reference
    ? reference.length > 10
      ? `${reference.slice(0, 10)}…`
      : reference
    : "—";

  const handleCopy = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      showToast("Reference copied!");
    } catch {
      showToast("Failed to copy.", "error");
    }
  };

  if (!reference) {
    return <span className="font-mono text-xs text-muted">—</span>;
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono text-xs text-purple-300 hover:text-purple-200"
      title={`Click to copy ${reference}`}
    >
      {display}
    </button>
  );
}

function ExplorerButton({ signature }: { signature: string | null }) {
  if (!signature) {
    return <span className="text-muted">—</span>;
  }

  return (
    <a
      href={getExplorerTxUrl(signature)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-elevated text-muted transition-colors hover:border-accent/50 hover:text-white"
      title="View on Solana Explorer"
      aria-label="View on Solana Explorer"
    >
      <i className="ti ti-external-link text-sm" />
    </a>
  );
}

function sortSellerRows(
  rows: SellerTransactionRow[],
  key: SellerSortKey,
  direction: SortDirection
) {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (key) {
      case "reference":
        return factor * (a.reference ?? "").localeCompare(b.reference ?? "");
      case "itemTitle":
        return factor * a.itemTitle.localeCompare(b.itemTitle);
      case "buyerWallet":
        return factor * a.buyerWallet.localeCompare(b.buyerWallet);
      case "date":
        return factor * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "itemSol":
        return factor * (a.amounts.itemSol - b.amounts.itemSol);
      case "shippingSol":
        return factor * (a.amounts.shippingSol - b.amounts.shippingSol);
      case "feeSol":
        return factor * (a.amounts.feeSol - b.amounts.feeSol);
      case "netSol":
        return factor * (a.amounts.netSol - b.amounts.netSol);
      case "usdApprox":
        return factor * (a.amounts.usdApprox - b.amounts.usdApprox);
      case "displayStatus":
        return factor * a.displayStatus.localeCompare(b.displayStatus);
      default:
        return 0;
    }
  });
}

function sortBuyerRows(
  rows: BuyerTransactionRow[],
  key: BuyerSortKey,
  direction: SortDirection
) {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (key) {
      case "reference":
        return factor * (a.reference ?? "").localeCompare(b.reference ?? "");
      case "itemTitle":
        return factor * a.itemTitle.localeCompare(b.itemTitle);
      case "sellerWallet":
        return factor * a.sellerWallet.localeCompare(b.sellerWallet);
      case "date":
        return factor * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "itemSol":
        return factor * (a.amounts.itemSol - b.amounts.itemSol);
      case "shippingSol":
        return factor * (a.amounts.shippingSol - b.amounts.shippingSol);
      case "totalSol":
        return factor * (a.amounts.totalSol - b.amounts.totalSol);
      case "usdApprox":
        return factor * (a.amounts.usdApprox - b.amounts.usdApprox);
      case "displayStatus":
        return factor * a.displayStatus.localeCompare(b.displayStatus);
      default:
        return 0;
    }
  });
}

export default function TransactionTable({
  role,
  sellerRows,
  buyerRows,
  onExportCsv,
  onExportPdf,
  pdfGenerating = false,
}: {
  role: TransactionRole;
  sellerRows: SellerTransactionRow[];
  buyerRows: BuyerTransactionRow[];
  onExportCsv: () => void;
  onExportPdf: () => void | Promise<void>;
  pdfGenerating?: boolean;
}) {
  const [sellerSortKey, setSellerSortKey] = useState<SellerSortKey>("date");
  const [buyerSortKey, setBuyerSortKey] = useState<BuyerSortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const handleSort = (key: string) => {
    if (role === "selling") {
      if (sellerSortKey === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSellerSortKey(key as SellerSortKey);
        setSortDirection("desc");
      }
    } else {
      if (buyerSortKey === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setBuyerSortKey(key as BuyerSortKey);
        setSortDirection("desc");
      }
    }
    setPage(1);
  };

  const sortedSeller = useMemo(
    () => sortSellerRows(sellerRows, sellerSortKey, sortDirection),
    [sellerRows, sellerSortKey, sortDirection]
  );

  const sortedBuyer = useMemo(
    () => sortBuyerRows(buyerRows, buyerSortKey, sortDirection),
    [buyerRows, buyerSortKey, sortDirection]
  );

  const rows = role === "selling" ? sortedSeller : sortedBuyer;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [role, sellerRows, buyerRows]);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeKey = role === "selling" ? sellerSortKey : buyerSortKey;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Transactions</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void onExportPdf()}
            disabled={pdfGenerating}
            className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pdfGenerating ? "Generating PDF..." : "Export PDF"}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
          No transactions in this period
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-surface-elevated/50">
                <tr>
                  {role === "selling" ? (
                    <>
                      <th className="px-3 py-3">
                        <SortHeader label="Reference" sortKey="reference" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Item" sortKey="itemTitle" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Buyer" sortKey="buyerWallet" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Date" sortKey="date" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Item (SOL)" sortKey="itemSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Shipping" sortKey="shippingSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Fee" sortKey="feeSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Net" sortKey="netSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <UsdColumnHeader sortKey="usdApprox" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Status" sortKey="displayStatus" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-muted">
                        Explorer
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3">
                        <SortHeader label="Reference" sortKey="reference" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Item" sortKey="itemTitle" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Seller" sortKey="sellerWallet" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Date" sortKey="date" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Item (SOL)" sortKey="itemSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Shipping" sortKey="shippingSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Total" sortKey="totalSol" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <UsdColumnHeader sortKey="usdApprox" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3">
                        <SortHeader label="Status" sortKey="displayStatus" activeKey={activeKey} direction={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="px-3 py-3 text-[10px] font-medium uppercase tracking-wider text-muted">
                        Explorer
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {role === "selling"
                  ? (pageRows as SellerTransactionRow[]).map((row) => (
                      <tr
                        key={row.auctionId}
                        className="border-b border-border/60 transition-colors hover:bg-surface-elevated/30"
                      >
                        <td className="px-3 py-2.5">
                          <CopyReference reference={row.reference} />
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2.5">
                          <Link
                            href={`/auction/${row.auctionId}`}
                            className="text-white hover:text-accent"
                            title={row.itemTitle}
                          >
                            {row.itemTitle}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted">
                          {shortenAddress(row.buyerWallet, 4)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {row.amounts.itemSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {row.amounts.shippingSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {row.amounts.feeSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-emerald-300">
                          {row.amounts.netSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <UsdCell row={row} />
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${sellerStatusBadgeClass(row.displayStatus)}`}
                          >
                            {SELLER_STATUS_LABELS[row.displayStatus]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <ExplorerButton signature={row.txSignature} />
                        </td>
                      </tr>
                    ))
                  : (pageRows as BuyerTransactionRow[]).map((row) => (
                      <tr
                        key={row.auctionId}
                        className="border-b border-border/60 transition-colors hover:bg-surface-elevated/30"
                      >
                        <td className="px-3 py-2.5">
                          <CopyReference reference={row.reference} />
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2.5">
                          <Link
                            href={`/auction/${row.auctionId}`}
                            className="text-white hover:text-blue-400"
                            title={row.itemTitle}
                          >
                            {row.itemTitle}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted">
                          {shortenAddress(row.sellerWallet, 4)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {row.amounts.itemSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {row.amounts.shippingSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-blue-300">
                          {row.amounts.totalSol.toFixed(4)}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <UsdCell row={row} />
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${buyerStatusBadgeClass(row.displayStatus)}`}
                          >
                            {BUYER_STATUS_LABELS[row.displayStatus]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <ExplorerButton signature={row.txSignature} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                Page {page} of {totalPages} · {rows.length} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
