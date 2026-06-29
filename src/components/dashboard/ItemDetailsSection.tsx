"use client";

import { useEffect, useRef, useState } from "react";

import type { ItemDetailRow } from "@/components/dashboard/ListingPreview";
import {
  getCategoryFields,
  type CategoryFieldDefinition,
} from "@/lib/category-fields";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

function DetailValueInput({
  row,
  index,
  onChange,
}: {
  row: ItemDetailRow;
  index: number;
  onChange: (index: number, value: string) => void;
}) {
  if (row.fieldType === "dropdown" && row.options?.length) {
    return (
      <select
        value={row.value}
        onChange={(event) => onChange(index, event.target.value)}
        className={inputClass}
      >
        <option value="">Select...</option>
        {row.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (row.fieldType === "number") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={row.value}
          onChange={(event) => onChange(index, event.target.value)}
          placeholder="0"
          className={inputClass}
        />
        {row.unit && (
          <span className="shrink-0 text-sm text-muted">{row.unit}</span>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={row.value}
      onChange={(event) => onChange(index, event.target.value)}
      placeholder="Enter value"
      className={inputClass}
    />
  );
}

export default function ItemDetailsSection({
  category,
  rows,
  onChange,
}: {
  category: string;
  rows: ItemDetailRow[];
  onChange: (rows: ItemDetailRow[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const suggestedFields = getCategoryFields(category);
  const addedKeys = new Set(rows.map((row) => row.key).filter(Boolean));

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pickerOpen]);

  const updateRowValue = (index: number, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], value };
    onChange(next);
  };

  const updateCustomRow = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addSuggestedField = (field: CategoryFieldDefinition) => {
    if (addedKeys.has(field.key)) return;

    onChange([
      ...rows,
      {
        key: field.key,
        label: field.label,
        value: "",
        fieldType: field.type,
        options: field.options,
        unit: field.unit,
        isCustom: false,
      },
    ]);
    setPickerOpen(false);
  };

  const addCustomField = () => {
    onChange([
      ...rows,
      {
        key: "",
        value: "",
        isCustom: true,
      },
    ]);
    setPickerOpen(false);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <p className={labelClass}>Item details</p>
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="text-xs font-medium text-accent hover:underline"
            aria-expanded={pickerOpen}
            aria-haspopup="true"
          >
            ＋ Add field
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl">
              {suggestedFields.length > 0 ? (
                <div className="max-h-64 overflow-y-auto p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Suggested for {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedFields.map((field) => {
                      const isAdded = addedKeys.has(field.key);

                      return (
                        <button
                          key={field.key}
                          type="button"
                          disabled={isAdded}
                          onClick={() => addSuggestedField(field)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            isAdded
                              ? "cursor-not-allowed bg-surface text-muted opacity-60"
                              : "bg-accent/15 text-purple-200 hover:bg-accent/25"
                          }`}
                        >
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-muted">
                  No suggested fields for this category.
                </div>
              )}

              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={addCustomField}
                  className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-left text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
                >
                  Custom field
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          No item details yet. Click ＋ Add field to add category-specific
          details.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.isCustom ? `custom-${index}` : row.key}
            className="rounded-xl border border-border bg-background/40 p-3"
          >
            {row.isCustom ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={row.key}
                  onChange={(event) =>
                    updateCustomRow(index, "key", event.target.value)
                  }
                  placeholder="Label (e.g. Size)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(event) =>
                    updateCustomRow(index, "value", event.target.value)
                  }
                  placeholder="Value (e.g. US 10)"
                  className={inputClass}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">
                  {row.label ?? row.key}
                </p>
                <DetailValueInput
                  row={row}
                  index={index}
                  onChange={updateRowValue}
                />
              </div>
            )}

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-xs text-muted transition-colors hover:text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
