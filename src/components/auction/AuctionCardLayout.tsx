import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatDomesticShippingLine } from "@/lib/auction-shipping";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

export function hasAuctionImageUrl(
  imageUrl: string | null | undefined
): boolean {
  return Boolean(imageUrl?.trim());
}

export function AuctionCategoryImagePlaceholder({
  category,
  className = "",
  textClassName = "text-xl",
}: {
  category?: string | null;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/55 via-purple-950 to-[#120a24] px-4 ${className}`.trim()}
      aria-hidden
    >
      <span
        className={`text-center font-semibold leading-tight text-white ${textClassName}`.trim()}
      >
        {category?.trim() || "Auction"}
      </span>
    </div>
  );
}

export const VIEW_AUCTION_BUTTON_CLASS =
  "block w-full rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover";

export function ViewAuctionButton({
  auctionId,
  className = "",
  asSpan = false,
}: {
  auctionId: string;
  className?: string;
  asSpan?: boolean;
}) {
  const classes = `${VIEW_AUCTION_BUTTON_CLASS} ${className}`.trim();

  if (asSpan) {
    return <span className={classes}>View Auction →</span>;
  }

  return (
    <Link href={`/auction/${auctionId}`} className={classes}>
      View Auction →
    </Link>
  );
}

export function AuctionCardImage({
  imageUrl,
  title,
  category,
  auction,
  imageClassName = "h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105",
}: {
  imageUrl: string | null | undefined;
  title: string;
  category?: string | null;
  auction: { category: string | null; title: string };
  imageClassName?: string;
}) {
  if (!hasAuctionImageUrl(imageUrl)) {
    return <AuctionCategoryImagePlaceholder category={category} />;
  }

  const imageSrc = resolveAuctionImageUrl(imageUrl, auction);

  return (
    <Image
      src={imageSrc}
      alt={title}
      width={800}
      height={192}
      className={imageClassName}
      unoptimized
    />
  );
}

/** Minimum width for carousel/grid auction cards — keeps price + timer on one line. */
export const AUCTION_CARD_MIN_WIDTH = "11.5rem";

export function AuctionCardContent({
  header,
  footer,
  className = "",
}: {
  header: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col justify-between p-4 ${className}`.trim()}
    >
      <div>{header}</div>
      <div>{footer}</div>
    </div>
  );
}

export function AuctionCardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`line-clamp-2 h-12 text-sm font-semibold text-white ${className}`.trim()}
    >
      {children}
    </h3>
  );
}

export function AuctionCardShippingLine({
  domesticShippingUsd = 0,
  className = "",
}: {
  domesticShippingUsd?: number;
  className?: string;
}) {
  return (
    <p
      className={`text-sm text-muted ${className}`.trim()}
    >
      {formatDomesticShippingLine(domesticShippingUsd)}
    </p>
  );
}

export function AuctionCardBidPrice({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  return (
    <p
      className={`whitespace-nowrap text-lg font-bold tabular-nums leading-tight text-accent ${className}`.trim()}
    >
      {formatSol(amount)}
    </p>
  );
}

export function AuctionCardCategorySlot({
  category,
}: {
  category?: string | null;
}) {
  if (category) {
    return (
      <span className="mt-2 inline-block w-fit rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
        {category}
      </span>
    );
  }

  return <span className="mt-2 block h-5" aria-hidden />;
}
