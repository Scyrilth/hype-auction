"use client";

import { useState } from "react";

import {
  DATE_PRESETS,
  getDateRangeFromPreset,
  type DateRange,
  type DateRangePreset,
} from "@/lib/transactions";

export default function DateRangeSelector({
  range,
  onChange,
  embedded = false,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  /** Use inside nested panels (e.g. admin) without full-bleed sticky bar. */
  embedded?: boolean;
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
    <div
      className={
        embedded
          ? "mb-4"
          : "sticky top-0 z-20 -mx-5 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-sm"
      }
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                range.preset === preset.id && !range.isCustom
                  ? "bg-accent text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                  : "border border-border bg-surface-elevated text-muted hover:border-accent/40 hover:text-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="ml-1.5 rounded-lg border border-border bg-surface-elevated px-2 py-1 text-xs text-white"
            />
          </label>
          <label className="text-xs text-muted">
            To
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="ml-1.5 rounded-lg border border-border bg-surface-elevated px-2 py-1 text-xs text-white"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
