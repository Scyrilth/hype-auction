"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { SearchIcon } from "@/components/icons";
import { formatSol } from "@/lib/format";
import type {
  VendorSuggestion,
  VendorSuggestionGroup,
} from "@/lib/vendor-suggestions";

function TagIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function ItemIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0 text-amber-400"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function formatFollowers(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

function SuggestionRow({
  suggestion,
  isActive,
  onSelect,
  onHover,
}: {
  suggestion: VendorSuggestion;
  isActive: boolean;
  onSelect: (suggestion: VendorSuggestion) => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      onClick={() => onSelect(suggestion)}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-accent/20 text-white"
          : "text-zinc-300 hover:bg-accent/10 hover:text-white"
      }`}
    >
      {suggestion.type === "vendor" && (
        <>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {suggestion.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {suggestion.shopName}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              {suggestion.username && <span>@{suggestion.username}</span>}
              <span>{formatFollowers(suggestion.followersCount)} followers</span>
              <span className="inline-flex items-center gap-0.5">
                <StarIcon />
                {suggestion.averageRating > 0
                  ? suggestion.averageRating.toFixed(1)
                  : "—"}
              </span>
            </span>
          </span>
        </>
      )}

      {suggestion.type === "category" && (
        <>
          <TagIcon />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {suggestion.name}
          </span>
          <span className="shrink-0 text-xs text-muted">
            {suggestion.vendorCount}{" "}
            {suggestion.vendorCount === 1 ? "vendor" : "vendors"}
          </span>
        </>
      )}

      {suggestion.type === "item" && (
        <>
          <ItemIcon />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {suggestion.title}
              </span>
              {suggestion.isLive && (
                <span className="shrink-0 rounded bg-live-red/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-live-red">
                  Live
                </span>
              )}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              <span className="truncate">{suggestion.vendorName}</span>
              <span>{formatSol(suggestion.currentBid)}</span>
              <span>
                {suggestion.bidCount}{" "}
                {suggestion.bidCount === 1 ? "bid" : "bids"}
              </span>
            </span>
          </span>
        </>
      )}
    </button>
  );
}

function SuggestionGroup({
  group,
  activeIndex,
  getNextIndex,
  onSelect,
  onHover,
}: {
  group: VendorSuggestionGroup;
  activeIndex: number;
  getNextIndex: () => number;
  onSelect: (suggestion: VendorSuggestion) => void;
  onHover: (index: number) => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {group.label}
      </p>
      {group.items.map((suggestion) => {
        const index = getNextIndex();
        return (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            isActive={index === activeIndex}
            onSelect={onSelect}
            onHover={() => onHover(index)}
          />
        );
      })}
    </div>
  );
}

export default function SearchSuggestionsDropdown({
  value,
  onChange,
  onSelect,
  onEnterWithoutSelection,
  suggestionGroups,
  flatSuggestions,
  queryReady,
  placeholder,
  listboxId,
  inputClassName,
  iconClassName,
  leadingSlot,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: VendorSuggestion) => void;
  onEnterWithoutSelection?: () => void;
  suggestionGroups: VendorSuggestionGroup[];
  flatSuggestions: VendorSuggestion[];
  queryReady: boolean;
  placeholder: string;
  listboxId: string;
  inputClassName: string;
  iconClassName?: string;
  leadingSlot?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const showDropdown = isOpen && queryReady;

  useEffect(() => {
    setActiveIndex(flatSuggestions.length ? 0 : -1);
  }, [value, flatSuggestions.length]);

  useEffect(() => {
    if (!showDropdown) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showDropdown]);

  const handleSelect = useCallback(
    (suggestion: VendorSuggestion) => {
      setIsOpen(false);
      onSelect(suggestion);
    },
    [onSelect]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (event.key === "ArrowDown" && queryReady) {
        setIsOpen(true);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onEnterWithoutSelection?.();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveIndex((index) => (index + 1) % flatSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!flatSuggestions.length) return;
      setActiveIndex((index) =>
        index <= 0 ? flatSuggestions.length - 1 : index - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && flatSuggestions[activeIndex]) {
        handleSelect(flatSuggestions[activeIndex]);
      } else {
        setIsOpen(false);
        onEnterWithoutSelection?.();
      }
    }
  };

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      {leadingSlot ?? (
        <SearchIcon
          className={
            iconClassName ??
            "pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted"
          }
        />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={listboxId}
        className={inputClassName}
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="vendor-suggestions-dropdown absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
        >
          {flatSuggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No matches found
            </p>
          ) : (
            suggestionGroups.map((group) => (
              <SuggestionGroup
                key={group.label}
                group={group}
                activeIndex={activeIndex}
                getNextIndex={() => {
                  runningIndex += 1;
                  return runningIndex;
                }}
                onSelect={handleSelect}
                onHover={setActiveIndex}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
