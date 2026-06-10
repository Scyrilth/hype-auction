import html2canvas from "html2canvas";
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

const MARGIN = 14;
const PAGE_WIDTH = 297;
const CHART_WIDTH = 85;
const CHART_HEIGHT = 55;
const CHART_GAP = 10;
const PURPLE: [number, number, number] = [124, 58, 237];
const BUYER_BLUE: [number, number, number] = [59, 130, 246];
const SUMMARY_BG: [number, number, number] = [249, 248, 255];
const MUTED_GRAY: [number, number, number] = [120, 120, 130];

type PdfChartKey = "earnings" | "volume" | "category" | "status";

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

function formatRowDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}

/** Deduplicate seller rows by auction ID, preferring a known buyer wallet. */
export function dedupeSellerRows(
  rows: SellerTransactionRow[]
): SellerTransactionRow[] {
  const byAuction = new Map<string, SellerTransactionRow>();

  for (const row of rows) {
    const existing = byAuction.get(row.auctionId);
    if (!existing) {
      byAuction.set(row.auctionId, row);
      continue;
    }
    if (existing.buyerWallet === "Unknown" && row.buyerWallet !== "Unknown") {
      byAuction.set(row.auctionId, row);
    }
  }

  return [...byAuction.values()];
}

/** Deduplicate buyer rows by auction ID. */
export function dedupeBuyerRows(
  rows: BuyerTransactionRow[]
): BuyerTransactionRow[] {
  const byAuction = new Map<string, BuyerTransactionRow>();
  for (const row of rows) {
    if (!byAuction.has(row.auctionId)) {
      byAuction.set(row.auctionId, row);
    }
  }
  return [...byAuction.values()];
}

async function captureChartImage(
  chartKey: PdfChartKey
): Promise<string | null> {
  try {
    const el = document.querySelector(`[data-pdf-chart="${chartKey}"]`);
    if (!el) {
      console.warn(`PDF chart element not found: ${chartKey}`);
      return null;
    }

    const canvas = await html2canvas(el as HTMLElement, {
      scale: 2,
      backgroundColor: "#0f0e24",
      useCORS: true,
      logging: false,
    });

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error(`PDF chart capture failed (${chartKey}):`, error);
    return null;
  }
}

function drawHeader(
  doc: jsPDF,
  isSeller: boolean,
  range: DateRange,
  currentSolUsdRate: number
): number {
  const accent = isSeller ? PURPLE : BUYER_BLUE;
  const roleLabel = isSeller ? "Seller Report" : "Buyer Report";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 30);
  doc.text("Hype Auction — Transaction History", MARGIN, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(roleLabel, 168, 16);

  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 20, PAGE_WIDTH - MARGIN, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 70);
  doc.text(range.label, MARGIN, 27);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
  doc.text(
    `Current SOL/USD rate: $${formatUsdExport(currentSolUsdRate)}. Historical transaction values use rate stored at payment time where available.`,
    MARGIN,
    33
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  return 38;
}

function drawSummaryGrid(
  doc: jsPDF,
  cells: { label: string; value: string }[],
  y: number
): number {
  const gridWidth = PAGE_WIDTH - MARGIN * 2;
  const gridHeight = 34;
  const cellWidth = gridWidth / 2;
  const cellHeight = gridHeight / 2;

  doc.setFillColor(SUMMARY_BG[0], SUMMARY_BG[1], SUMMARY_BG[2]);
  doc.rect(MARGIN, y, gridWidth, gridHeight, "F");

  doc.setDrawColor(210, 208, 224);
  doc.setLineWidth(0.3);
  doc.line(MARGIN + cellWidth, y, MARGIN + cellWidth, y + gridHeight);
  doc.line(MARGIN, y + cellHeight, MARGIN + gridWidth, y + cellHeight);

  cells.forEach((cell, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * cellWidth + 5;
    const cellY = y + row * cellHeight + 9;

    doc.setFontSize(8);
    doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
    doc.text(cell.label, x, cellY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 40);
    doc.text(cell.value, x, cellY + 6);
    doc.setFont("helvetica", "normal");
  });

  doc.setTextColor(0, 0, 0);
  return y + gridHeight + 6;
}

function addChartPair(
  doc: jsPDF,
  leftImg: string | null,
  rightImg: string | null,
  y: number,
  leftTitle: string,
  rightTitle: string
): number {
  const leftX = MARGIN;
  const rightX = MARGIN + CHART_WIDTH + CHART_GAP;

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text(leftTitle, leftX, y);
  doc.text(rightTitle, rightX, y);

  const imageY = y + 3;
  if (leftImg) {
    doc.addImage(leftImg, "PNG", leftX, imageY, CHART_WIDTH, CHART_HEIGHT);
  }
  if (rightImg) {
    doc.addImage(rightImg, "PNG", rightX, imageY, CHART_WIDTH, CHART_HEIGHT);
  }

  return imageY + CHART_HEIGHT + 8;
}

export function exportSellerCsv(
  rows: SellerTransactionRow[],
  filename = "hype-auction-seller-transactions.csv"
) {
  const deduped = dedupeSellerRows(rows);
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
    "SOL/USD Rate",
    "Status",
    "Explorer",
  ];

  const lines = [
    headers.join(","),
    ...deduped.map((row) =>
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
        row.solUsdRateAtPayment != null
          ? formatUsdExport(row.solUsdRateAtPayment)
          : "current",
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
  const deduped = dedupeBuyerRows(rows);
  const headers = [
    "Reference",
    "Item",
    "Seller",
    "Date",
    "Item (SOL)",
    "Shipping (SOL)",
    "Total (SOL)",
    "USD",
    "SOL/USD Rate",
    "Status",
    "Explorer",
  ];

  const lines = [
    headers.join(","),
    ...deduped.map((row) =>
      [
        row.reference ?? "",
        row.itemTitle,
        row.sellerWallet,
        new Date(row.date).toISOString(),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.totalSol),
        formatUsdExport(row.amounts.usdApprox),
        row.solUsdRateAtPayment != null
          ? formatUsdExport(row.solUsdRateAtPayment)
          : "current",
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

export async function exportTransactionsPdf({
  role,
  range,
  summary,
  rows,
  currentSolUsdRate,
}: {
  role: TransactionRole;
  range: DateRange;
  summary: SellerSummary | BuyerSummary;
  rows: SellerTransactionRow[] | BuyerTransactionRow[];
  currentSolUsdRate: number;
}): Promise<void> {
  const isSeller = role === "selling";
  const dedupedRows = isSeller
    ? dedupeSellerRows(rows as SellerTransactionRow[])
    : dedupeBuyerRows(rows as BuyerTransactionRow[]);

  const [earningsImg, volumeImg, categoryImg, statusImg] = await Promise.all([
    captureChartImage("earnings"),
    captureChartImage("volume"),
    captureChartImage("category"),
    captureChartImage("status"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const accent = isSeller ? PURPLE : BUYER_BLUE;

  let y = drawHeader(doc, isSeller, range, currentSolUsdRate);

  if (isSeller) {
    const s = summary as SellerSummary;
    y = drawSummaryGrid(doc, [
      { label: "Total earned", value: `${formatSolExport(s.totalEarned.current)} SOL` },
      {
        label: "Pending escrow",
        value: `${formatSolExport(s.pendingEscrow.current)} SOL (${s.pendingOrderCount})`,
      },
      {
        label: "Platform fees paid",
        value: `${formatSolExport(s.platformFees.current)} SOL`,
      },
      {
        label: "Total refunded",
        value: `${formatSolExport(s.totalRefunded.current)} SOL`,
      },
    ], y);
  } else {
    const b = summary as BuyerSummary;
    y = drawSummaryGrid(doc, [
      { label: "Total spent", value: `${formatSolExport(b.totalSpent.current)} SOL` },
      {
        label: "Pending",
        value: `${formatSolExport(b.pending.current)} SOL (${b.pendingOrderCount})`,
      },
      {
        label: "Total refunded",
        value: `${formatSolExport(b.totalRefunded.current)} SOL`,
      },
      {
        label: "Purchases completed",
        value: String(b.purchasesCompleted.current),
      },
    ], y);
  }

  addChartPair(
    doc,
    earningsImg,
    volumeImg,
    y,
    isSeller ? "Earnings over time" : "Spending over time",
    isSeller ? "Transaction volume" : "Purchase volume"
  );

  doc.addPage();
  addChartPair(
    doc,
    categoryImg,
    statusImg,
    MARGIN + 4,
    "Category breakdown",
    isSeller ? "Escrow status breakdown" : "Status breakdown"
  );

  doc.addPage();
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 40);
  doc.text("Transactions", MARGIN, 18);

  const tableStartY = 24;

  if (isSeller) {
    autoTable(doc, {
      startY: tableStartY,
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
      body: (dedupedRows as SellerTransactionRow[]).map((row) => [
        row.reference ?? "—",
        row.itemTitle,
        row.buyerWallet === "Unknown"
          ? "—"
          : row.buyerWallet.slice(0, 8) + "…",
        formatRowDate(row.date),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.feeSol),
        formatSolExport(row.amounts.netSol),
        `$${formatUsdExport(row.amounts.usdApprox)}`,
        SELLER_STATUS_LABELS[row.displayStatus],
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: accent, fontSize: 9 },
    });
  } else {
    autoTable(doc, {
      startY: tableStartY,
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
      body: (dedupedRows as BuyerTransactionRow[]).map((row) => [
        row.reference ?? "—",
        row.itemTitle,
        row.sellerWallet.slice(0, 8) + "…",
        formatRowDate(row.date),
        formatSolExport(row.amounts.itemSol),
        formatSolExport(row.amounts.shippingSol),
        formatSolExport(row.amounts.totalSol),
        `$${formatUsdExport(row.amounts.usdApprox)}`,
        BUYER_STATUS_LABELS[row.displayStatus],
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: accent, fontSize: 9 },
    });
  }

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? tableStartY + 20;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(MUTED_GRAY[0], MUTED_GRAY[1], MUTED_GRAY[2]);
  doc.text(
    `* Historical rates used where available. Current rate: $${formatUsdExport(currentSolUsdRate)} used for transactions without stored rate.`,
    MARGIN,
    finalY + 8
  );

  doc.save(
    `hype-auction-${isSeller ? "seller" : "buyer"}-transactions.pdf`
  );
}
