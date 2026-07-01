"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AuctionCategoryImagePlaceholder,
  hasAuctionImageUrl,
} from "@/components/auction/AuctionCardLayout";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";

export default function AuctionImageGallery({ auction }: { auction: Auction }) {
  const hasImage = hasAuctionImageUrl(auction.image_url);

  const images = useMemo(() => {
    const main = resolveAuctionImageUrl(auction.image_url, auction);
    const extras = (auction.additional_images ?? []).filter(Boolean);
    return [main, ...extras.filter((url) => url !== main)];
  }, [auction]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];
  const title = auction.title?.trim() || "Auction";

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        goToPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        goToNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeLightbox, goToNext, goToPrevious, lightboxOpen]);

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            if (hasImage && activeImage) setLightboxOpen(true);
          }}
          disabled={!hasImage || !activeImage}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated text-left disabled:cursor-default"
          aria-label={hasImage ? `View full image for ${title}` : undefined}
        >
          {hasImage && activeImage ? (
            <Image
              src={activeImage}
              alt={title}
              fill
              className="cursor-zoom-in object-cover transition-opacity hover:opacity-95"
              priority
              unoptimized
            />
          ) : (
            <AuctionCategoryImagePlaceholder
              category={auction.category}
              textClassName="text-2xl sm:text-3xl"
            />
          )}
        </button>

        {hasImage && images.length > 1 && (
          <div className="horizontal-scroll-row flex gap-2 overflow-x-auto pb-1">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`horizontal-scroll-item relative h-16 w-16 overflow-hidden rounded-lg border bg-surface-elevated transition-colors sm:h-20 sm:w-20 ${
                  index === activeIndex
                    ? "border-accent ring-2 ring-accent/40"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image viewer`}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black/70"
          >
            Close
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70 sm:left-6"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70 sm:right-6"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="max-h-full max-w-full overflow-auto"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={title}
              className="mx-auto max-h-[calc(100vh-4rem)] w-auto max-w-full object-contain"
            />
          </div>

          {images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
