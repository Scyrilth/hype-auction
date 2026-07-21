"use client";

import Image from "next/image";

import AuctionCardPricingFooter from "@/components/auction/AuctionCardPricingFooter";
import { GradingBadge } from "@/components/dashboard/GradeSelect";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import {
  buildGradingItemDetails,
  type GradingCompany,
} from "@/lib/grading";
import {
  formatItemDetailValue,
  getItemDetailLabel,
  type CategoryFieldType,
} from "@/lib/category-fields";
import type { ListingType } from "@/lib/database.types";
import { GTC_END_TIME } from "@/lib/listing-types";

function listingPreviewShippingProps(form: ListingFormState) {
  if (form.freeDomesticShipping) {
    return { freeShipping: true as const };
  }

  if (form.domesticShippingUsd.trim() === "") {
    return undefined;
  }

  const domestic = parseFloat(form.domesticShippingUsd);
  if (isNaN(domestic)) {
    return undefined;
  }

  let international = 0;
  if (
    !form.freeInternationalShipping &&
    form.internationalShippingUsd.trim() !== ""
  ) {
    const parsed = parseFloat(form.internationalShippingUsd);
    if (!isNaN(parsed)) {
      international = parsed;
    }
  }

  return {
    domesticShippingUsd: domestic,
    internationalShippingUsd: international,
  };
}

export type ItemDetailRow = {
  key: string;
  value: string;
  label?: string;
  fieldType?: CategoryFieldType;
  options?: string[];
  unit?: string;
  isCustom?: boolean;
};

export type ListingFormState = {
  listingType: ListingType;
  buyNowPrice: string;
  goodTillCancelled: boolean;
  durationMode: "set_duration" | "gtc";
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
  domesticShippingUsd: string;
  internationalShippingUsd: string;
  freeDomesticShipping: boolean;
  freeInternationalShipping: boolean;
  itemDetails: ItemDetailRow[];
};

export default function ListingPreview({ form }: { form: ListingFormState }) {
  const isFixedPrice = form.listingType === "fixed_price";
  const price = isFixedPrice
    ? parseFloat(form.buyNowPrice)
    : parseFloat(form.startPrice);
  const displayBid = !isNaN(price) && price > 0 ? price : 0;
  const durationHours = parseInt(form.durationHours, 10);
  const endTime = form.goodTillCancelled
    ? GTC_END_TIME
    : new Date(
        Date.now() + (isNaN(durationHours) ? 24 : durationHours) * 60 * 60 * 1000
      ).toISOString();

  const previewAuction = {
    id: "preview",
    title: form.title || "Preview",
    description: form.description,
    image_url: form.imageUrl || null,
    seller_wallet: "preview",
    current_bid: 0,
    start_price: displayBid,
    end_time: endTime,
    status: "live" as const,
    category: form.category,
    condition: form.condition,
    additional_images: [],
    item_details: {},
    created_at: new Date().toISOString(),
    is_featured: false,
    reference_number: null,
    tracking_courier: null,
    tracking_number: null,
    tracking_uploaded_at: null,
    shipping_status: "pending" as const,
    escrow_pda: null,
    escrow_tx_signature: null,
    escrow_funded: false,
    escrow_funded_at: null,
    escrow_amount_lamports: null,
    escrow_attempt_number: 1,
    escrow_state: "none" as const,
    escrow_expired_at: null,
    sol_usd_rate_at_payment: null,
    payment_completed_at: null,
    domestic_shipping_usd: parseFloat(form.domesticShippingUsd) || 0,
    international_shipping_usd: parseFloat(form.internationalShippingUsd) || 0,
    is_dummy: false,
    next_bidder_offered_at: null,
    next_bidder_response_deadline: null,
    next_bidder_wallet: null,
    relisted_auction_id: null,
    payment_excluded_wallets: [],
    ended_early: false,
    early_end_reason: null,
    early_end_at: null,
    early_end_by: null,
    winner_wallet: null,
    buy_now_price:
      form.listingType === "auction_buy_now" || isFixedPrice
        ? parseFloat(form.buyNowPrice) || null
        : null,
    purchase_type: "auction" as const,
    listing_type: form.listingType,
    good_till_cancelled: form.goodTillCancelled,
    ship_reminder_sent: false,
  };

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

  const previewShipping = listingPreviewShippingProps(form);

  return (
    <div className="sticky top-5 rounded-2xl border border-border bg-surface p-5">
      <article className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="relative aspect-[4/3] bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={form.title || "Listing preview"}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white/60">
            Listing preview
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
                  <dt className="text-muted">
                    {row.label ?? getItemDetailLabel(form.category, row.key)}
                  </dt>
                  <dd className="text-right font-medium text-zinc-300">
                    {formatItemDetailValue(form.category, row.key, row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-4">
            <AuctionCardPricingFooter
              auction={previewAuction}
              amount={displayBid}
              shipping={previewShipping}
              endTime={endTime}
              showTimeLeft={!form.goodTillCancelled}
              bidCount={0}
            />
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
