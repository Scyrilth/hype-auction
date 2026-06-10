import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getExplorerTxUrl } from "@/lib/escrow";
import { SELLER_STATUS_LABELS, BUYER_STATUS_LABELS } from "./status";
import type {
  BuyerSummary,
  BuyerTransactionRow,
  DateRange,
  SellerSummary,
  SellerTransactionRow,
  TransactionRole,
} from "./types";

function formatSolExport(value: number): string {
  return value.toFixed(4);
}

function formatUsdExport(value: number): string {
  return value.toFixed(2);
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportSellerCsv(
  rows: SellerTransactionRow[],
  filename = "hype-auction-seller-transactions.csv"
) {
  const headers = [
    "Reference",
    "Item",
    "Buyer",
    "Date",
    "Item (SOL)",
    "Shipping (SOL)",
    "Fee (SOL)",
    "Net (SOL)",
    "USD",
    "Status",
    "Explorer",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.reference ?? "",
        row.itemTitle,
        row.buyerWallet,
        new Date(row.date).toISOString(),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.feeSol),
        formatSolExport(row.amounts.netSol),
        formatUsdExport(row.amounts.usdApprox),
        SELLER_STATUS_LABELS[row.displayStatus],
        row.txSignature ? getExplorerTxUrl(row.txSignature) : "",
      ]
        .map((cell) => escapeCsv(String(cell)))
        .join(",")
    ),
  ];

  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportBuyerCsv(
  rows: BuyerTransactionRow[],
  filename = "hype-auction-buyer-transactions.csv"
) {
  const headers = [
    "Reference",
    "Item",
    "Seller",
    "Date",
    "Item (SOL)",
    "Shipping (SOL)",
    "Total (SOL)",
    "USD",
    "Status",
    "Explorer",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.reference ?? "",
        row.itemTitle,
        row.sellerWallet,
        new Date(row.date).toISOString(),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.totalSol),
        formatUsdExport(row.amounts.usdApprox),
        BUYER_STATUS_LABELS[row.displayStatus],
        row.txSignature ? getExplorerTxUrl(row.txSignature) : "",
      ]
        .map((cell) => escapeCsv(String(cell)))
        .join(",")
    ),
  ];

  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsPdf({
  role,
  range,
  summary,
  rows,
}: {
  role: TransactionRole;
  range: DateRange;
  summary: SellerSummary | BuyerSummary;
  rows: SellerTransactionRow[] | BuyerTransactionRow[];
}) {
  const doc = new jsPDF({ orientation: "landscape" });
  const isSeller = role === "selling";

  doc.setFontSize(18);
  doc.text("Hype Auction — Transaction History", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `${isSeller ? "Seller" : "Buyer"} report · ${range.label}`,
    14,
    26
  );
  doc.setTextColor(0);

  let y = 34;
  doc.setFontSize(11);

  if (isSeller) {
    const s = summary as SellerSummary;
    doc.text(`Total earned: ${formatSolExport(s.totalEarned.current)} SOL`, 14, y);
    y += 6;
    doc.text(
      `Pending escrow: ${formatSolExport(s.pendingEscrow.current)} SOL (${s.pendingOrderCount} orders)`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Platform fees: ${formatSolExport(s.platformFees.current)} SOL`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Total refunded: ${formatSolExport(s.totalRefunded.current)} SOL`,
      14,
      y
    );
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [
        [
          "Reference",
          "Item",
          "Buyer",
          "Date",
          "Item",
          "Ship",
          "Fee",
          "Net",
          "USD",
          "Status",
        ],
      ],
      body: (rows as SellerTransactionRow[]).map((row) => [
        row.reference ?? "—",
        row.itemTitle,
        row.buyerWallet.slice(0, 8) + "…",
        new Date(row.date).toLocaleDateString(),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.feeSol),
        formatSolExport(row.amounts.netSol),
        `$${formatUsdExport(row.amounts.usdApprox)}`,
        SELLER_STATUS_LABELS[row.displayStatus],
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] },
    });
  } else {
    const b = summary as BuyerSummary;
    doc.text(`Total spent: ${formatSolExport(b.totalSpent.current)} SOL`, 14, y);
    y += 6;
    doc.text(
      `Pending: ${formatSolExport(b.pending.current)} SOL (${b.pendingOrderCount} orders)`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Total refunded: ${formatSolExport(b.totalRefunded.current)} SOL`,
      14,
      y
    );
    y += 6;
    doc.text(
      `Purchases completed: ${b.purchasesCompleted.current}`,
      14,
      y
    );
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [
        [
          "Reference",
          "Item",
          "Seller",
          "Date",
          "Item",
          "Ship",
          "Total",
          "USD",
          "Status",
        ],
      ],
      body: (rows as BuyerTransactionRow[]).map((row) => [
        row.reference ?? "—",
        row.itemTitle,
        row.sellerWallet.slice(0, 8) + "…",
        new Date(row.date).toLocaleDateString(),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.totalSol),
        `$${formatUsdExport(row.amounts.usdApprox)}`,
        BUYER_STATUS_LABELS[row.displayStatus],
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(
    `hype-auction-${isSeller ? "seller" : "buyer"}-transactions.pdf`
  );
}
