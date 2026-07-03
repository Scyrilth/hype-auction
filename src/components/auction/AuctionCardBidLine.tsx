"use client";

import { useSolPrice } from "@/hooks/useSolPrice";
import { formatSol } from "@/lib/format";

export default function AuctionCardBidLine({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  const { solPrice, loading } = useSolPrice();
  const usd =
    !loading && solPrice !== null && solPrice > 0
      ? amount * solPrice
      : null;

  return (
    <p
      className={`whitespace-nowrap text-base font-bold tabular-nums leading-tight text-accent ${className}`.trim()}
    >
      {formatSol(amount)}
      {usd !== null && Number.isFinite(usd) && usd >= 0 ? (
        <span className="ml-1.5 text-[11px] font-normal text-muted">
          ~${usd.toFixed(2)}
        </span>
      ) : null}
    </p>
  );
}
