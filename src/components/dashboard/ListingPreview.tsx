"use client";

import Image from "next/image";

import CountdownTimer from "@/components/auction/CountdownTimer";
import { GradingBadge } from "@/components/dashboard/GradeSelect";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import {
  buildGradingItemDetails,
  type GradingCompany,
} from "@/lib/grading";
import { formatSol } from "@/lib/format";

export type ListingFormState = {
  title: string;
  description: string;
  category: string;
  condition: string;
  hasProfessionalGrade: boolean;
  gradingCompany: GradingCompany;
  gradingGradeId: string;
  startPrice: string;
  durationHours: string;
  imageUrl: string;
  additionalImages: string[];
  itemDetails: { key: string; value: string }[];
};

export default function ListingPreview({ form }: { form: ListingFormState }) {
  const price = parseFloat(form.startPrice);
  const displayBid = !isNaN(price) && price > 0 ? price : 0;
  const durationHours = parseInt(form.durationHours, 10);
  const endTime = new Date(
    Date.now() + (isNaN(durationHours) ? 24 : durationHours) * 60 * 60 * 1000
  ).toISOString();

  const imageSrc = resolveAuctionImageUrl(form.imageUrl || null, {
    title: form.title || "Preview",
    category: form.category,
  });

  const detailEntries = form.itemDetails.filter(
    (row) => row.key.trim() && row.value.trim()
  );

  const gradingPreview =
    form.hasProfessionalGrade && form.gradingGradeId
      ? buildGradingItemDetails(form.gradingCompany, form.gradingGradeId)
      : null;

  return (
    <div className="sticky top-5 rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Preview
      </p>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
        <div className="relative aspect-[4/3] bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={form.title || "Listing preview"}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        </div>

        <div className="p-4">
          <h3 className="text-base font-semibold text-white">
            {form.title || "Your auction title"}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {form.category && (
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                {form.category}
              </span>
            )}
            {form.condition && (
              <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                {form.condition}
              </span>
            )}
            {gradingPreview && (
              <GradingBadge
                company={gradingPreview.grading_company}
                grade={gradingPreview.grade}
                label={gradingPreview.grade_label}
              />
            )}
          </div>

          {form.description && (
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-400">
              {form.description}
            </p>
          )}

          {detailEntries.length > 0 && (
            <dl className="mt-4 space-y-1.5 rounded-xl border border-border bg-surface/60 p-3">
              {detailEntries.map((row) => (
                <div key={row.key} className="flex justify-between gap-3 text-xs">
                  <dt className="text-muted">{row.key}</dt>
                  <dd className="text-right font-medium text-zinc-300">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Starting bid</p>
              <p className="text-lg font-bold text-accent">
                {displayBid > 0 ? formatSol(displayBid) : "— SOL"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Time left</p>
              <CountdownTimer endTime={endTime} compact />
            </div>
          </div>
        </div>
      </article>

      {form.additionalImages.some((url) => url.trim()) && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {form.additionalImages
            .filter((url) => url.trim())
            .map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-elevated"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
