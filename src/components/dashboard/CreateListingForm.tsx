"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ItemDetailsSection from "@/components/dashboard/ItemDetailsSection";
import ListingPreview, {
  type ListingFormState,
} from "@/components/dashboard/ListingPreview";
import GradeSelect from "@/components/dashboard/GradeSelect";
import ImageUpload from "@/components/ui/ImageUpload";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { useToast } from "@/components/ui/Toast";
import type { Auction } from "@/lib/database.types";
import {
  FREE_SHIPPING_WARNING,
  isDummySellerWallet,
} from "@/lib/auction-shipping";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  buildGradingItemDetails,
  GRADING_COMPANIES,
  GRADES_BY_COMPANY,
  type GradingCompany,
} from "@/lib/grading";
import { getImageExtension } from "@/lib/storage";
import {
  AUCTION_CATEGORIES,
  AUCTION_CONDITIONS,
  AUCTION_DURATIONS,
  createAuction,
} from "@/lib/seller";
import { getVendorSettings } from "@/lib/vendors";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const inputErrorClass =
  "w-full rounded-xl border border-live-red/60 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-live-red focus:ring-1 focus:ring-live-red/40";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

type FieldErrors = {
  title?: string;
  category?: string;
  condition?: string;
  imageUrl?: string;
  domesticShippingUsd?: string;
  internationalShippingUsd?: string;
  startPrice?: string;
};

const initialForm: ListingFormState = {
  title: "",
  description: "",
  category: AUCTION_CATEGORIES[0],
  condition: AUCTION_CONDITIONS[0],
  hasProfessionalGrade: false,
  gradingCompany: "PSA",
  gradingGradeId: GRADES_BY_COMPANY.PSA[0].id,
  startPrice: "",
  durationHours: String(AUCTION_DURATIONS[4].hours),
  imageUrl: "",
  additionalImages: ["", "", "", ""],
  itemDetails: [],
  domesticShippingUsd: "",
  internationalShippingUsd: "",
  freeDomesticShipping: false,
  freeInternationalShipping: false,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-live-red">{message}</p>;
}

export default function CreateListingForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [form, setForm] = useState<ListingFormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedAuction, setPublishedAuction] = useState<Auction | null>(
    null
  );
  const [sellerCountry, setSellerCountry] = useState<string | null>(null);
  const [shipsInternationally, setShipsInternationally] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    let cancelled = false;
    setSettingsLoading(true);

    void getVendorSettings(publicKey.toBase58())
      .then((profile) => {
        if (cancelled) return;
        setSellerCountry(profile?.country ?? null);
        setShipsInternationally(profile?.ships_internationally ?? false);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const updateForm = <K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateAdditionalImage = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.additionalImages];
      next[index] = value;
      return { ...current, additionalImages: next };
    });
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!form.title.trim()) {
      errors.title = "Title is required.";
    }

    if (!form.category.trim()) {
      errors.category = "Category is required.";
    }

    if (!form.condition.trim()) {
      errors.condition = "Condition is required.";
    }

    if (!form.imageUrl.trim()) {
      errors.imageUrl = "Please add at least one image.";
    }

    if (!form.freeDomesticShipping) {
      const domesticShipping = parseFloat(form.domesticShippingUsd);
      if (
        form.domesticShippingUsd.trim() === "" ||
        isNaN(domesticShipping) ||
        domesticShipping < 0
      ) {
        errors.domesticShippingUsd = "Enter a valid domestic shipping price.";
      }
    }

    const price = parseFloat(form.startPrice);
    if (!form.startPrice.trim() || isNaN(price) || price <= 0) {
      errors.startPrice = "Enter a valid starting bid.";
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!publicKey) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const price = parseFloat(form.startPrice);
    const domesticShipping = form.freeDomesticShipping
      ? 0
      : parseFloat(form.domesticShippingUsd);
    const internationalShipping = shipsInternationally
      ? form.freeInternationalShipping
        ? 0
        : form.internationalShippingUsd.trim() === ""
          ? 0
          : parseFloat(form.internationalShippingUsd) || 0
      : 0;

    try {
      const itemDetails = Object.fromEntries(
        form.itemDetails
          .filter((row) => row.key.trim() && row.value.trim())
          .map((row) => [row.key.trim(), row.value.trim()])
      );

      if (form.hasProfessionalGrade) {
        const grading = buildGradingItemDetails(
          form.gradingCompany,
          form.gradingGradeId
        );
        if (!grading) {
          showToast("Select a valid grading company and grade.", "error");
          setIsSubmitting(false);
          return;
        }
        Object.assign(itemDetails, grading);
      }

      const auction = await createAuction({
        sellerWallet: publicKey.toBase58(),
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        startPrice: price,
        durationHours: parseInt(form.durationHours, 10),
        imageUrl: form.imageUrl,
        additionalImages: form.additionalImages,
        itemDetails,
        domesticShippingUsd: domesticShipping,
        internationalShippingUsd: internationalShipping,
      });

      setPublishedAuction(auction);
      showToast("Auction published successfully!");
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (error) {
      logSupabaseError("CreateListingForm", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wallet = publicKey?.toBase58();
  if (!wallet) return null;

  const isDummySeller = isDummySellerWallet(wallet);
  const needsShippingSetup = !isDummySeller && !sellerCountry?.trim();

  if (settingsLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">Loading seller settings...</p>
      </div>
    );
  }

  if (needsShippingSetup) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-white">
          Set up your seller profile before creating a listing
        </h1>
        <p className="mt-3 text-sm text-muted">
          You need to add your country and shipping settings before you can list
          items for sale.
        </p>
        <Link
          href="/dashboard/settings?sellerSetup=1"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Set up seller profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-white"
      >
        ← Back to Dashboard
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Create New Listing
        </h1>
        <p className="mt-1 text-sm text-muted">
          Fill in the details below and preview how your auction will appear.
        </p>
      </header>

      {publishedAuction && (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">
            Auction published successfully!
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            Your private reference number (share only with the winning buyer):
          </p>
          {publishedAuction.reference_number && (
            <div className="mt-2">
              <ReferenceNumber referenceNumber={publishedAuction.reference_number} />
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            Redirecting to dashboard...
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Title <span className="text-live-red">*</span>
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. 1999 Pokemon Pikachu Holo #58"
                className={fieldErrors.title ? inputErrorClass : inputClass}
              />
              <FieldError message={fieldErrors.title} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Describe the item, its condition, authenticity, and any notable details."
                className={`${inputClass} resize-y min-h-[140px]`}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-live-red">*</span>
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className={fieldErrors.category ? inputErrorClass : inputClass}
              >
                {AUCTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.category} />
            </div>

            <div>
              <label htmlFor="condition" className={labelClass}>
                Condition <span className="text-live-red">*</span>
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => updateForm("condition", e.target.value)}
                className={fieldErrors.condition ? inputErrorClass : inputClass}
              >
                {AUCTION_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.condition} />
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.hasProfessionalGrade}
                  onChange={(e) =>
                    updateForm("hasProfessionalGrade", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border bg-background accent-accent"
                />
                <span className="text-sm text-zinc-300">
                  This item has been professionally graded
                </span>
              </label>

              {form.hasProfessionalGrade && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gradingCompany" className={labelClass}>
                      Grading Company
                    </label>
                    <select
                      id="gradingCompany"
                      value={form.gradingCompany}
                      onChange={(e) => {
                        const company = e.target.value as GradingCompany;
                        const firstGrade = GRADES_BY_COMPANY[company][0]?.id ?? "";
                        setForm((current) => ({
                          ...current,
                          gradingCompany: company,
                          gradingGradeId: firstGrade,
                        }));
                      }}
                      className={inputClass}
                    >
                      {GRADING_COMPANIES.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="gradingGrade" className={labelClass}>
                      Grade
                    </label>
                    <GradeSelect
                      id="gradingGrade"
                      options={GRADES_BY_COMPANY[form.gradingCompany]}
                      value={form.gradingGradeId}
                      onChange={(gradeId) =>
                        updateForm("gradingGradeId", gradeId)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.freeDomesticShipping}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((current) => ({
                      ...current,
                      freeDomesticShipping: checked,
                      domesticShippingUsd: checked ? "0" : "",
                    }));
                    setFieldErrors((current) => ({
                      ...current,
                      domesticShippingUsd: undefined,
                    }));
                  }}
                  className="h-4 w-4 rounded border-border bg-background accent-accent"
                />
                <span className="text-sm text-zinc-300">Free shipping</span>
              </label>
              {form.freeDomesticShipping && (
                <p className="mt-2 text-xs leading-relaxed text-amber-400/90">
                  {FREE_SHIPPING_WARNING}
                </p>
              )}
              {!form.freeDomesticShipping && (
                <div className="mt-3">
                  <label htmlFor="domesticShippingUsd" className={labelClass}>
                    Domestic shipping (USD){" "}
                    <span className="text-live-red">*</span>
                  </label>
                  <input
                    id="domesticShippingUsd"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.domesticShippingUsd}
                    onChange={(e) =>
                      updateForm("domesticShippingUsd", e.target.value)
                    }
                    placeholder="e.g. 5.00"
                    className={
                      fieldErrors.domesticShippingUsd
                        ? inputErrorClass
                        : inputClass
                    }
                  />
                  <FieldError message={fieldErrors.domesticShippingUsd} />
                </div>
              )}
            </div>

            {shipsInternationally && (
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.freeInternationalShipping}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((current) => ({
                        ...current,
                        freeInternationalShipping: checked,
                        internationalShippingUsd: checked ? "0" : "",
                      }));
                      setFieldErrors((current) => ({
                        ...current,
                        internationalShippingUsd: undefined,
                      }));
                    }}
                    className="h-4 w-4 rounded border-border bg-background accent-accent"
                  />
                  <span className="text-sm text-zinc-300">
                    Free international shipping
                  </span>
                </label>
                {form.freeInternationalShipping && (
                  <p className="mt-2 text-xs leading-relaxed text-amber-400/90">
                    {FREE_SHIPPING_WARNING}
                  </p>
                )}
                {!form.freeInternationalShipping && (
                  <div className="mt-3">
                    <label
                      htmlFor="internationalShippingUsd"
                      className={labelClass}
                    >
                      International shipping (USD)
                    </label>
                    <input
                      id="internationalShippingUsd"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.internationalShippingUsd}
                      onChange={(e) =>
                        updateForm("internationalShippingUsd", e.target.value)
                      }
                      placeholder="e.g. 20.00"
                      className={
                        fieldErrors.internationalShippingUsd
                          ? inputErrorClass
                          : inputClass
                      }
                    />
                    <FieldError message={fieldErrors.internationalShippingUsd} />
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="startPrice" className={labelClass}>
                Starting bid (SOL) <span className="text-live-red">*</span>
              </label>
              <input
                id="startPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={form.startPrice}
                onChange={(e) => updateForm("startPrice", e.target.value)}
                placeholder="1.00"
                className={fieldErrors.startPrice ? inputErrorClass : inputClass}
              />
              <FieldError message={fieldErrors.startPrice} />
            </div>

            <div>
              <label htmlFor="duration" className={labelClass}>
                Duration
              </label>
              <select
                id="duration"
                value={form.durationHours}
                onChange={(e) => updateForm("durationHours", e.target.value)}
                className={inputClass}
              >
                {AUCTION_DURATIONS.map(({ label, hours }) => (
                  <option key={hours} value={hours}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <ImageUpload
                label="Main image"
                bucket="Auction-images"
                variant="auction"
                maxSizeMb={10}
                showUrl
                value={form.imageUrl}
                onChange={(url) => updateForm("imageUrl", url)}
                buildPath={(file) =>
                  `${wallet}/${Date.now()}-main.${getImageExtension(file)}`
                }
              />
              <FieldError message={fieldErrors.imageUrl} />
            </div>

            <div className="sm:col-span-2">
              <p className={labelClass}>Additional images (up to 4)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {form.additionalImages.map((url, index) => (
                  <ImageUpload
                    key={index}
                    label={`Additional image ${index + 1}`}
                    bucket="Auction-images"
                    variant="auction"
                    maxSizeMb={10}
                    showUrl
                    value={url}
                    onChange={(nextUrl) => updateAdditionalImage(index, nextUrl)}
                    buildPath={(file) =>
                      `${wallet}/${Date.now()}-${index + 1}.${getImageExtension(file)}`
                    }
                  />
                ))}
              </div>
            </div>

            <ItemDetailsSection
              category={form.category}
              rows={form.itemDetails}
              onChange={(itemDetails) =>
                setForm((current) => ({ ...current, itemDetails }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish Auction"}
          </button>
        </form>

        <ListingPreview form={form} />
      </div>
    </div>
  );
}
