"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  isShippedLedgerEvent,
  sellerStatusBadgeClass,
  SELLER_STATUS_LABELS,
  SHIPPED_EVENT_SUBTITLE,
} from "@/lib/transactions";

const PAGE_SIZE = 20;

function AmountDash() {
  return <span className="text-muted">—</span>;
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
      className="inline-flex items-center gap-1 text-left font-medium text-muted hover:text-white"
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

function CopyTransactionId({
  platformTransactionId,
  reference,
}: {
  platformTransactionId: string;
  reference: string | null;
}) {
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(platformTransactionId);
      showToast("Transaction ID copied!");
    } catch {
      showToast("Failed to copy.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="max-w-[130px] text-left"
      title={`Click to copy ${platformTransactionId}`}
    >
      <p className="break-all font-mono text-[10px] leading-tight text-purple-300">
        {platformTransactionId}
      </p>
      {reference ? (
        <p className="mt-0.5 break-all font-mono text-[9px] leading-tight text-muted">
          {reference}
        </p>
      ) : null}
    </button>
  );
}

function ScanLink({
  signature,
  solscanUrl,
}: {
  signature: string | null;
  solscanUrl?: string | null;
}) {
  const href = solscanUrl ?? (signature ? getExplorerTxUrl(signature) : null);
  if (!href) {
    return <span className="text-muted">—</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] text-purple-300 hover:text-accent"
    >
      Scan
    </a>
  );
}

function directionClass(direction: "inward" | "outward") {
  return direction === "inward" ? "text-emerald-400" : "text-red-400";
}

function TransactionAmountCell({
  row,
  role,
}: {
  row: SellerTransactionRow | BuyerTransactionRow;
  role: TransactionRole;
}) {
  if (isShippedLedgerEvent(row.eventType)) {
    return (
      <div>
        <AmountDash />
        <p className="mt-0.5 text-[9px] text-muted" title={SHIPPED_EVENT_SUBTITLE}>
          {SHIPPED_EVENT_SUBTITLE}
        </p>
      </div>
    );
  }

  const amountSol =
    role === "selling"
      ? (row as SellerTransactionRow).amounts.netSol
      : (row as BuyerTransactionRow).amounts.totalSol;

  return (
    <div className="whitespace-nowrap text-[11px] leading-tight">
      <p className="font-mono">{amountSol.toFixed(4)} SOL</p>
      <p className="mt-0.5 text-[10px] text-muted">
        ~${row.amounts.usdApprox.toFixed(2)}
      </p>
    </div>
  );
}

function StatusWithDirection({
  role,
  row,
}: {
  role: TransactionRole;
  row: SellerTransactionRow | BuyerTransactionRow;
}) {
  const label =
    role === "selling"
      ? SELLER_STATUS_LABELS[(row as SellerTransactionRow).displayStatus]
      : BUYER_STATUS_LABELS[(row as BuyerTransactionRow).displayStatus];
  const badgeClass =
    role === "selling"
      ? sellerStatusBadgeClass((row as SellerTransactionRow).displayStatus)
      : buyerStatusBadgeClass((row as BuyerTransactionRow).displayStatus);

  return (
    <span className="inline-flex max-w-[140px] flex-wrap items-center gap-1">
      <span className={`rounded-full px-1.5 py-px text-[10px] ${badgeClass}`}>
        {label}
      </span>
      <span
        className={`text-[9px] font-semibold uppercase ${directionClass(row.direction)}`}
      >
        {row.direction}
      </span>
    </span>
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
      case "platformTransactionId":
        return (
          factor *
          a.platformTransactionId.localeCompare(b.platformTransactionId)
        );
      case "itemTitle":
        return factor * a.itemTitle.localeCompare(b.itemTitle);
      case "buyerWallet":
        return factor * a.buyerWallet.localeCompare(b.buyerWallet);
      case "date":
        return factor * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amountSol":
        return factor * (a.amounts.netSol - b.amounts.netSol);
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
      case "platformTransactionId":
        return (
          factor *
          a.platformTransactionId.localeCompare(b.platformTransactionId)
        );
      case "itemTitle":
        return factor * a.itemTitle.localeCompare(b.itemTitle);
      case "sellerWallet":
        return factor * a.sellerWallet.localeCompare(b.sellerWallet);
      case "date":
        return factor * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amountSol":
        return factor * (a.amounts.totalSol - b.amounts.totalSol);
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
  const counterpartyLabel = role === "selling" ? "Buyer" : "Seller";
  const counterpartySortKey = role === "selling" ? "buyerWallet" : "sellerWallet";

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
          <div className="overflow-hidden rounded border border-border bg-surface">
            <table className="w-full table-fixed text-left text-[11px]">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="w-[14%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label="Txn ID"
                      sortKey="platformTransactionId"
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[22%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label="Item"
                      sortKey="itemTitle"
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[11%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label={counterpartyLabel}
                      sortKey={counterpartySortKey}
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[9%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label="Date"
                      sortKey="date"
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[13%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label="Amount"
                      sortKey="amountSol"
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[18%] px-2 py-1.5 font-medium">
                    <SortHeader
                      label="Status"
                      sortKey="displayStatus"
                      activeKey={activeKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="w-[7%] px-2 py-1.5 font-medium">Tx</th>
                </tr>
              </thead>
              <tbody>
                {role === "selling"
                  ? (pageRows as SellerTransactionRow[]).map((row) => (
                      <tr
                        key={`${row.auctionId}-${row.eventType}-${row.date}`}
                        className="border-t border-border/60 align-top"
                      >
                        <td className="px-2 py-1.5">
                          <CopyTransactionId
                            platformTransactionId={row.platformTransactionId}
                            reference={row.reference}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Link
                            href={`/auction/${row.auctionId}`}
                            className="line-clamp-2 block leading-tight text-white hover:text-accent"
                            title={row.itemTitle}
                          >
                            {row.itemTitle}
                          </Link>
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[10px] text-muted">
                          {shortenAddress(row.buyerWallet, 3)}
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-muted">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1.5">
                          <TransactionAmountCell row={row} role={role} />
                        </td>
                        <td className="px-2 py-1.5">
                          <StatusWithDirection role={role} row={row} />
                        </td>
                        <td className="px-2 py-1.5">
                          <ScanLink
                            signature={row.txSignature}
                            solscanUrl={row.solscanUrl}
                          />
                        </td>
                      </tr>
                    ))
                  : (pageRows as BuyerTransactionRow[]).map((row) => (
                      <tr
                        key={`${row.auctionId}-${row.eventType}-${row.date}`}
                        className="border-t border-border/60 align-top"
                      >
                        <td className="px-2 py-1.5">
                          <CopyTransactionId
                            platformTransactionId={row.platformTransactionId}
                            reference={row.reference}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Link
                            href={`/auction/${row.auctionId}`}
                            className="line-clamp-2 block leading-tight text-white hover:text-blue-400"
                            title={row.itemTitle}
                          >
                            {row.itemTitle}
                          </Link>
                        </td>
                        <td className="px-2 py-1.5 font-mono text-[10px] text-muted">
                          {shortenAddress(row.sellerWallet, 3)}
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-muted">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-1.5">
                          <TransactionAmountCell row={row} role={role} />
                        </td>
                        <td className="px-2 py-1.5">
                          <StatusWithDirection role={role} row={row} />
                        </td>
                        <td className="px-2 py-1.5">
                          <ScanLink
                            signature={row.txSignature}
                            solscanUrl={row.solscanUrl}
                          />
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
