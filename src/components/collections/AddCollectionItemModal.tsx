"use client";

import { useEffect, useState } from "react";

import GradeSelect from "@/components/dashboard/GradeSelect";
import ItemDetailsSection from "@/components/dashboard/ItemDetailsSection";
import type { ItemDetailRow } from "@/components/dashboard/ListingPreview";
import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCategoryLabels } from "@/lib/categories";
import { getCategoryFields } from "@/lib/category-fields";
import {
  addCollectionItem,
  updateCollectionItem,
  type CollectionItem,
} from "@/lib/collections";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  AUCTION_CONDITIONS,
  buildGradingItemDetails,
  filterCustomItemDetails,
  GRADING_COMPANIES,
  GRADES_BY_COMPANY,
  type GradingCompany,
} from "@/lib/grading";
import { getImageExtension } from "@/lib/storage";

const CATEGORY_OPTIONS = getCategoryLabels();

const ACQUISITION_METHODS = [
  { value: "hype_auction", label: "Won on Hype Auction" },
  { value: "bought_online", label: "Bought online" },
  { value: "bought_in_store", label: "Bought in store" },
  { value: "gift", label: "Gift" },
  { value: "trade", label: "Trade" },
  { value: "other", label: "Other" },
] as const;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0d0d1a] px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

type AddItemFormState = {
  name: string;
  category: string;
  condition: string;
  hasProfessionalGrade: boolean;
  gradingCompany: GradingCompany;
  gradingGradeId: string;
  year: string;
  brand: string;
  images: string[];
  estimatedValue: string;
  verificationUrl: string;
  acquisitionMethod: (typeof ACQUISITION_METHODS)[number]["value"];
  notes: string;
  itemDetails: ItemDetailRow[];
};

function findGradeId(company: GradingCompany, gradeValue: string): string {
  const options = GRADES_BY_COMPANY[company] ?? [];
  const match = options.find((option) => option.grade === gradeValue);
  return match?.id ?? options[0]?.id ?? "";
}

function itemDetailsToRows(
  category: string,
  details: Record<string, string>
): ItemDetailRow[] {
  const filtered = filterCustomItemDetails(details);
  const suggestedFields = getCategoryFields(category);
  const suggestedMap = new Map(suggestedFields.map((field) => [field.key, field]));

  return Object.entries(filtered).map(([key, value]) => {
    const field = suggestedMap.get(key);
    if (field) {
      return {
        key: field.key,
        label: field.label,
        value,
        fieldType: field.type,
        options: field.options,
        unit: field.unit,
        isCustom: false,
      };
    }
    return { key, value, isCustom: true };
  });
}

function imagesToSlots(images: string[]): string[] {
  const slots = [...images];
  while (slots.length < 4) slots.push("");
  return slots.slice(0, 4);
}

function createInitialForm(): AddItemFormState {
  return {
    name: "",
    category: CATEGORY_OPTIONS[0],
    condition: AUCTION_CONDITIONS[0],
    hasProfessionalGrade: false,
    gradingCompany: "PSA" as GradingCompany,
    gradingGradeId: GRADES_BY_COMPANY.PSA[0].id,
    year: "",
    brand: "",
    images: ["", "", "", ""],
    estimatedValue: "",
    verificationUrl: "",
    acquisitionMethod: "other" as (typeof ACQUISITION_METHODS)[number]["value"],
    notes: "",
    itemDetails: [],
  };
}

function formFromItem(item: CollectionItem): AddItemFormState {
  const category = item.category ?? CATEGORY_OPTIONS[0];
  const hasGrade = Boolean(item.grading_company && item.grade);
  const gradingCompany = (item.grading_company as GradingCompany) ?? "PSA";
  const acquisitionValues = ACQUISITION_METHODS.map((method) => method.value);
  const acquisitionMethod = acquisitionValues.includes(
    item.acquisition_method as (typeof ACQUISITION_METHODS)[number]["value"]
  )
    ? (item.acquisition_method as (typeof ACQUISITION_METHODS)[number]["value"])
    : "other";

  return {
    name: item.name,
    category,
    condition: item.condition ?? AUCTION_CONDITIONS[0],
    hasProfessionalGrade: hasGrade,
    gradingCompany: GRADING_COMPANIES.some((c) => c.id === gradingCompany)
      ? gradingCompany
      : "PSA",
    gradingGradeId: hasGrade
      ? findGradeId(
          GRADING_COMPANIES.some((c) => c.id === gradingCompany)
            ? gradingCompany
            : "PSA",
          item.grade!
        )
      : GRADES_BY_COMPANY.PSA[0].id,
    year: item.year != null ? String(item.year) : "",
    brand: item.brand ?? "",
    images: imagesToSlots(item.images),
    estimatedValue:
      item.estimated_value_sol != null ? String(item.estimated_value_sol) : "",
    verificationUrl: item.verification_url ?? "",
    acquisitionMethod,
    notes: item.notes ?? "",
    itemDetails: itemDetailsToRows(category, item.item_details),
  };
}

export default function AddCollectionItemModal({
  open,
  onClose,
  collectionId,
  wallet,
  mode = "add",
  initialData,
  onItemAdded,
  onItemUpdated,
}: {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  wallet: string;
  mode?: "add" | "edit";
  initialData?: CollectionItem;
  onItemAdded?: (item: CollectionItem) => void;
  onItemUpdated?: (item: CollectionItem) => void;
}) {
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const isEditMode = mode === "edit" && Boolean(initialData);
  const [form, setForm] = useState<AddItemFormState>(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      setForm(formFromItem(initialData));
    } else {
      setForm(createInitialForm());
    }
  }, [open, isEditMode, initialData]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const resetForm = () => setForm(createInitialForm());

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateImage = (index: number, url: string) => {
    setForm((current) => {
      const next = [...current.images];
      next[index] = url;
      return { ...current, images: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      showToast("Item name is required.", "error");
      return;
    }

    if (!form.category) {
      showToast("Category is required.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const customDetails = Object.fromEntries(
        form.itemDetails
          .filter((row) => row.key.trim() && row.value.trim())
          .map((row) => [row.key.trim(), row.value.trim()])
      );

      let gradingCompany: string | null = null;
      let grade: string | null = null;
      let gradeLabel: string | null = null;

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
        gradingCompany = grading.grading_company;
        grade = grading.grade;
        gradeLabel = grading.grade_label;
      }

      const itemDetails = filterCustomItemDetails(customDetails);
      const images = form.images.filter(Boolean);
      const estimatedValue = form.estimatedValue.trim()
        ? parseFloat(form.estimatedValue)
        : null;

      const payload = {
        name: trimmedName,
        category: form.category,
        condition: form.condition,
        grading_company: gradingCompany,
        grade,
        grade_label: gradeLabel,
        year: form.year.trim() ? parseInt(form.year, 10) : null,
        brand: form.brand.trim() || null,
        images,
        notes: form.notes.trim().slice(0, 500) || null,
        estimated_value_sol:
          estimatedValue != null && !Number.isNaN(estimatedValue)
            ? estimatedValue
            : null,
        verification_url: form.verificationUrl.trim() || null,
        acquisition_method: form.acquisitionMethod,
        item_details: itemDetails,
      };

      if (isEditMode && initialData) {
        const item = await updateCollectionItem(initialData.id, wallet, payload, client);
        showToast("Item updated!");
        onItemUpdated?.(item);
      } else {
        const item = await addCollectionItem(collectionId, wallet, payload, client);
        showToast("Item added to collection!");
        onItemAdded?.(item);
      }

      resetForm();
      onClose();
    } catch (error) {
      logSupabaseError("AddCollectionItemModal", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
        aria-label="Close add item modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-collection-item-title"
        className="relative z-10 max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1835] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id="add-collection-item-title"
            className="text-lg font-bold text-white"
          >
            {isEditMode ? "Edit Item" : "Add Item to Collection"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="item-name" className={labelClass}>
              Item Name *
            </label>
            <input
              id="item-name"
              type="text"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. 1999 Pokemon Pikachu Holo #58"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-category" className={labelClass}>
                Category *
              </label>
              <select
                id="item-category"
                required
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                    itemDetails: [],
                  }))
                }
                className={inputClass}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-condition" className={labelClass}>
                Condition
              </label>
              <select
                id="item-condition"
                value={form.condition}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
                className={inputClass}
              >
                {AUCTION_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#0d0d1a]/60 px-4 py-3">
              <input
                type="checkbox"
                checked={form.hasProfessionalGrade}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    hasProfessionalGrade: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-white/20 bg-[#0d0d1a] accent-accent"
              />
              <span className="text-sm text-zinc-300">
                This item has been professionally graded
              </span>
            </label>

            {form.hasProfessionalGrade && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="item-grading-company" className={labelClass}>
                    Grading Company
                  </label>
                  <select
                    id="item-grading-company"
                    value={form.gradingCompany}
                    onChange={(event) => {
                      const company = event.target.value as GradingCompany;
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
                  <label htmlFor="item-grading-grade" className={labelClass}>
                    Grade
                  </label>
                  <GradeSelect
                    id="item-grading-grade"
                    options={GRADES_BY_COMPANY[form.gradingCompany]}
                    value={form.gradingGradeId}
                    onChange={(gradeId) =>
                      setForm((current) => ({
                        ...current,
                        gradingGradeId: gradeId,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-year" className={labelClass}>
                Year
              </label>
              <input
                id="item-year"
                type="number"
                min="1800"
                max="2100"
                value={form.year}
                onChange={(event) =>
                  setForm((current) => ({ ...current, year: event.target.value }))
                }
                placeholder="1999"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="item-brand" className={labelClass}>
                Brand
              </label>
              <input
                id="item-brand"
                type="text"
                value={form.brand}
                onChange={(event) =>
                  setForm((current) => ({ ...current, brand: event.target.value }))
                }
                placeholder="e.g. Topps, Nike"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>Images (up to 4)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {form.images.map((url, index) => (
                <ImageUpload
                  key={index}
                  label={`Image ${index + 1}`}
                  bucket="Auction-images"
                  variant="auction"
                  maxSizeMb={10}
                  value={url}
                  onChange={(nextUrl) => updateImage(index, nextUrl)}
                  buildPath={(file) =>
                    `collections/${wallet}/${collectionId}/${Date.now()}-${index + 1}.${getImageExtension(file)}`
                  }
                  client={client}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="item-estimated-value" className={labelClass}>
              Estimated Value
            </label>
            <div className="flex items-center gap-2">
              <input
                id="item-estimated-value"
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estimatedValue: event.target.value,
                  }))
                }
                placeholder="0.00"
                className={inputClass}
              />
              <span className="shrink-0 text-sm font-medium text-muted">
                SOL
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="item-verification-url" className={labelClass}>
              Verify estimate (optional)
            </label>
            <input
              id="item-verification-url"
              type="url"
              value={form.verificationUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  verificationUrl: event.target.value,
                }))
              }
              placeholder="Paste a link to a recent sale e.g. eBay, Heritage Auctions"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="item-acquisition" className={labelClass}>
              Acquisition Method
            </label>
            <select
              id="item-acquisition"
              value={form.acquisitionMethod}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  acquisitionMethod: event.target
                    .value as (typeof ACQUISITION_METHODS)[number]["value"],
                }))
              }
              className={inputClass}
            >
              {ACQUISITION_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="item-notes"
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Any additional notes about this item..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {form.notes.length}/500
            </p>
          </div>

          <ItemDetailsSection
            category={form.category}
            rows={form.itemDetails}
            onChange={(itemDetails) =>
              setForm((current) => ({ ...current, itemDetails }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add to Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
