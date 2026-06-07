"use client";

import { useEffect, useRef, useState } from "react";

import { CATEGORIES } from "@/lib/categories";

export default function BrowseCategoryPill({
  value,
  onChange,
}: {
  value: string;
  onChange: (category: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const label = value === "all" ? "All Categories" : value;

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
        {label}
        <span className="text-[10px] text-muted" aria-hidden>
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 max-h-56 w-48 overflow-y-auto rounded-xl border border-border bg-surface-elevated py-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={`flex w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent/10 ${
              value === "all" ? "font-semibold text-white" : "text-zinc-300"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onChange(category.label);
                setOpen(false);
              }}
              className={`flex w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent/10 ${
                value === category.label
                  ? "font-semibold text-white"
                  : "text-zinc-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
