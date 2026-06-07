"use client";

import { useEffect, useRef, useState } from "react";

import {
  BROWSE_SECTION_SORT_OPTIONS,
  getSectionSortLabel,
  type BrowseSectionSortOption,
} from "@/lib/browse-filters";

export default function BrowseSortPill({
  value,
  onChange,
}: {
  value: BrowseSectionSortOption;
  onChange: (sort: BrowseSectionSortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {getSectionSortLabel(value)}
        <span className="text-[10px] text-muted" aria-hidden>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-xl">
          {BROWSE_SECTION_SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`flex w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent/10 ${
                value === option.id
                  ? "font-semibold text-white"
                  : "text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
