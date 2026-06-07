"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ListingPreview, {
  type ListingFormState,
} from "@/components/dashboard/ListingPreview";
import GradeSelect from "@/components/dashboard/GradeSelect";
import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
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

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

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
  itemDetails: [{ key: "", value: "" }],
};

export default function CreateListingForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [form, setForm] = useState<ListingFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = <K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateAdditionalImage = (index: number, value: string) => {
    setForm((current) => {
      const next = [...current.additionalImages];
      next[index] = value;
      return { ...current, additionalImages: next };
    });
  };

  const updateDetailRow = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setForm((current) => {
      const next = [...current.itemDetails];
      next[index] = { ...next[index], [field]: value };
      return { ...current, itemDetails: next };
    });
  };

  const addDetailRow = () => {
    setForm((current) => ({
      ...current,
      itemDetails: [...current.itemDetails, { key: "", value: "" }],
    }));
  };

  const removeDetailRow = (index: number) => {
    setForm((current) => ({
      ...current,
      itemDetails: current.itemDetails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!publicKey) return;

    const price = parseFloat(form.startPrice);
    if (!form.title.trim() || isNaN(price) || price <= 0) {
      showToast("Enter a valid title and starting bid.", "error");
      return;
    }

    setIsSubmitting(true);

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

      await createAuction({
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
      });

      showToast("Auction published successfully!");
      router.push("/dashboard");
    } catch (error) {
      logSupabaseError("CreateListingForm", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wallet = publicKey?.toBase58();
  if (!wallet) return null;

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Title
              </label>
              <input
                id="title"
                required
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="e.g. 1999 Pokemon Pikachu Holo #58"
                className={inputClass}
              />
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
                placeholder="Describe the item, authenticity, shipping, and any notable details..."
                className={`${inputClass} resize-y min-h-[140px]`}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className={inputClass}
              >
                {AUCTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className={labelClass}>
                Condition
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => updateForm("condition", e.target.value)}
                className={inputClass}
              >
                {AUCTION_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
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

            <div>
              <label htmlFor="startPrice" className={labelClass}>
                Starting bid (SOL)
              </label>
              <input
                id="startPrice"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.startPrice}
                onChange={(e) => updateForm("startPrice", e.target.value)}
                placeholder="1.00"
                className={inputClass}
              />
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

            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className={labelClass}>Item details</p>
                <button
                  type="button"
                  onClick={addDetailRow}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  + Add row
                </button>
              </div>
              <div className="space-y-2">
                {form.itemDetails.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={row.key}
                      onChange={(e) =>
                        updateDetailRow(index, "key", e.target.value)
                      }
                      placeholder="Label (e.g. Size)"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) =>
                        updateDetailRow(index, "value", e.target.value)
                      }
                      placeholder="Value (e.g. US 10)"
                      className={inputClass}
                    />
                    {form.itemDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetailRow(index)}
                        className="shrink-0 rounded-xl border border-border px-3 text-sm text-muted hover:text-white"
                        aria-label="Remove detail row"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
