"use client";

import { useState } from "react";

import { adminTabClass } from "@/components/admin/admin-tab-styles";
import {
  DATE_PRESETS,
  getDateRangeFromPreset,
  type DateRange,
  type DateRangePreset,
} from "@/lib/transactions";

/** Compact date range control for admin panels (not the consumer transactions bar). */
export default function AdminDateRangeFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const selectPreset = (preset: DateRangePreset) => {
    onChange(getDateRangeFromPreset(preset));
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return;
    onChange(getDateRangeFromPreset("all", from, to));
  };

  return (
    <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-0.5">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset.id)}
            className={adminTabClass(
              range.preset === preset.id && !range.isCustom
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted">
        <label>
          From
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="ml-0.5 rounded border border-border bg-surface-elevated px-1 py-px text-[10px] text-white"
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="ml-0.5 rounded border border-border bg-surface-elevated px-1 py-px text-[10px] text-white"
          />
        </label>
        <button
          type="button"
          onClick={applyCustom}
          className={`${adminTabClass(false)} border border-border bg-surface-elevated`}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
