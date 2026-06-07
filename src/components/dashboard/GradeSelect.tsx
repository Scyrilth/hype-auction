"use client";

import { useEffect, useRef, useState } from "react";

import type { GradeOption } from "@/lib/grading";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function GradeOptionLabel({ option }: { option: GradeOption }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-bold text-white">{option.grade}</span>
      <span className="text-xs text-muted">{option.label}</span>
    </span>
  );
}

export default function GradeSelect({
  options,
  value,
  onChange,
  id,
}: {
  options: GradeOption[];
  value: string;
  onChange: (gradeId: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value) ?? options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (options.length && !options.some((option) => option.id === value)) {
      onChange(options[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when options list changes
  }, [options, value]);

  if (!options.length) {
    return (
      <div className={`${selectClass} text-muted`}>No grades available</div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${selectClass} flex w-full items-center justify-between text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? <GradeOptionLabel option={selected} /> : "Select grade"}
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-xl"
        >
          {options.map((option) => (
            <li key={option.id} role="option" aria-selected={option.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`flex w-full px-4 py-2.5 text-left transition-colors hover:bg-surface-elevated ${
                  option.id === value ? "bg-accent/10" : ""
                }`}
              >
                <GradeOptionLabel option={option} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GradingBadge({
  company,
  grade,
  label,
}: {
  company: string;
  grade: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
      <span>{company}</span>
      <span className="font-bold text-amber-100">{grade}</span>
      <span className="font-normal text-amber-200/80">— {label}</span>
    </span>
  );
}
