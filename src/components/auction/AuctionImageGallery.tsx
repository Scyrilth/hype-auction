"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";

export default function AuctionImageGallery({
  auction,
  isLive,
}: {
  auction: Auction;
  isLive: boolean;
}) {
  const images = useMemo(() => {
    const main = resolveAuctionImageUrl(auction.image_url, auction);
    const extras = auction.additional_images.filter(Boolean);
    return [main, ...extras.filter((url) => url !== main)];
  }, [auction]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-elevated">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={auction.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : null}

        {isLive && (
          <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-md bg-live-red px-2.5 py-1 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-surface-elevated transition-colors sm:h-20 sm:w-20 ${
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
  );
}
