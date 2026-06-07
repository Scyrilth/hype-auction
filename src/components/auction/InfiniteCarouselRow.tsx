"use client";

import { useEffect, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function InfiniteCarouselRow<T>({
  items,
  renderItem,
  getKey,
  visibleCount = 5,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  visibleCount?: number;
}) {
  const [startIndex, setStartIndex] = useState(0);
  const itemCount = items.length;
  const slots = Math.min(visibleCount, itemCount);

  useEffect(() => {
    setStartIndex(0);
  }, [itemCount]);

  if (itemCount === 0) return null;

  const visibleItems = Array.from(
    { length: slots },
    (_, slotIndex) => items[(startIndex + slotIndex) % itemCount]
  );

  const showArrows = itemCount > 1;

  return (
    <div className="flex items-center gap-2">
      {showArrows ? (
        <button
          type="button"
          onClick={() =>
            setStartIndex((index) => (index - 1 + itemCount) % itemCount)
          }
          className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 shrink-0" aria-hidden />
      )}

      <div
        className="grid min-w-0 flex-1 gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((item, slotIndex) => (
          <div
            key={`${getKey(item)}-${slotIndex}-${startIndex}`}
            className="min-w-0 transition-opacity duration-300"
          >
            {renderItem(item)}
          </div>
        ))}
      </div>

      {showArrows ? (
        <button
          type="button"
          onClick={() => setStartIndex((index) => (index + 1) % itemCount)}
          className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-9 shrink-0" aria-hidden />
      )}
    </div>
  );
}
