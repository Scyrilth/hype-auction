"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import FiatValue from "@/components/ui/FiatValue";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { AuctionSummaryPayload } from "@/lib/auction-lifecycle";
import {
  formatItemDetailValue,
  getItemDetailLabel,
} from "@/lib/category-fields";
import { formatSol } from "@/lib/format";

const EXCLUDED_DETAIL_KEYS = new Set([
  "grading_company",
  "grade",
  "grade_label",
]);

function formatGradingBadge(summary: AuctionSummaryPayload): string | null {
  const company = summary.grading_company?.trim();
  const grade = summary.grade?.trim();
  const label = summary.grade_label?.trim();

  if (!company && !grade) return null;

  const head = [company, grade].filter(Boolean).join(" ");
  return label ? `${head} — ${label}` : head;
}

function getTopItemDetails(summary: AuctionSummaryPayload) {
  return Object.entries(summary.item_details ?? {})
    .filter(([key, value]) => value.trim() && !EXCLUDED_DETAIL_KEYS.has(key))
    .slice(0, 4)
    .map(([key, value]) => ({
      key,
      label: getItemDetailLabel(summary.category, key),
      value: formatItemDetailValue(summary.category, key, value),
    }));
}

export default function AuctionSummaryTile({
  summary,
}: {
  summary: AuctionSummaryPayload;
}) {
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const imageSrc = resolveAuctionImageUrl(summary.image_url, {
    title: summary.title,
    category: summary.category,
  });
  const gradingBadge = formatGradingBadge(summary);
  const detailRows = getTopItemDetails(summary);

  return (
    <div className="w-full overflow-visible rounded-xl border border-accent/40 bg-surface-elevated p-3 sm:p-2.5">
      <div className="border-b border-border/60 pb-2 sm:pb-2">
        <h3 className="text-sm font-bold text-white">
          🎉 Congratulations, you won!
        </h3>
        <p className="mt-0.5 hidden text-[11px] text-purple-300 sm:block">
          Coordinate shipping and delivery in this thread.
        </p>
      </div>

      {/* Mobile: compact summary */}
      <div className="mt-3 sm:hidden">
        <p className="text-sm font-bold text-white">{summary.title}</p>
        <p className="mt-1 text-sm font-bold text-accent">
          Winning Bid: {formatSol(summary.winning_bid)}
        </p>
        {summary.reference_number && (
          <div className="mt-1.5">
            <ReferenceNumber
              referenceNumber={summary.reference_number}
              className="text-[11px] text-muted"
            />
          </div>
        )}

        {!mobileDetailsOpen ? (
          <button
            type="button"
            onClick={() => setMobileDetailsOpen(true)}
            className="mt-2 text-xs font-semibold text-accent hover:text-purple-300"
          >
            Show details
          </button>
        ) : (
          <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
            <div className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background">
                <Image
                  src={imageSrc}
                  alt={summary.title}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover object-center"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {summary.category && (
                    <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                      {summary.category}
                    </span>
                  )}
                  {summary.condition && (
                    <span className="inline-block rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      {summary.condition}
                    </span>
                  )}
                </div>
                {gradingBadge && (
                  <span className="mt-1.5 inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    {gradingBadge}
                  </span>
                )}
              </div>
            </div>

            {detailRows.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {detailRows.map((row) => (
                  <div key={row.key} className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      {row.label}
                    </p>
                    <p className="break-words text-xs font-medium text-zinc-200">
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <FiatValue solAmount={summary.winning_bid} showTooltip={false} />
              <Link
                href={`/auction/${summary.auction_id}`}
                className="shrink-0 text-xs font-semibold text-purple-300 transition-colors hover:text-accent"
              >
                View Auction →
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileDetailsOpen(false)}
              className="text-xs font-semibold text-muted hover:text-white"
            >
              Hide details
            </button>
          </div>
        )}
      </div>

      {/* Desktop: compact summary */}
      <div className="mt-3 hidden sm:block">
        <div className="flex gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
            <Image
              src={imageSrc}
              alt={summary.title}
              width={48}
              height={48}
              className="h-full w-full object-cover object-center"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{summary.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-accent">
                  Winning bid: {formatSol(summary.winning_bid)}
                </p>
              </div>
              <Link
                href={`/auction/${summary.auction_id}`}
                className="shrink-0 text-xs font-semibold text-purple-300 transition-colors hover:text-accent"
              >
                View Auction →
              </Link>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {summary.category && (
                <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                  {summary.category}
                </span>
              )}
              {summary.condition && (
                <span className="inline-block rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                  {summary.condition}
                </span>
              )}
              {gradingBadge && (
                <span className="inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  {gradingBadge}
                </span>
              )}
            </div>

            {summary.reference_number && (
              <div className="mt-1.5">
                <ReferenceNumber
                  referenceNumber={summary.reference_number}
                  className="text-[11px] text-muted"
                />
              </div>
            )}
          </div>
        </div>

        {detailRows.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/60 pt-2">
            {detailRows.slice(0, 2).map((row) => (
              <div key={row.key} className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted">
                  {row.label}
                </p>
                <p className="truncate text-xs font-medium text-zinc-200">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
