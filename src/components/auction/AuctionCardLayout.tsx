import type { ReactNode } from "react";

import { formatSol } from "@/lib/format";

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
      className={`flex min-h-0 flex-1 flex-col justify-between p-4 ${className}`.trim()}
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
