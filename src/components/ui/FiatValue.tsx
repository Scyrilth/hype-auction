"use client";

import { useSolPrice } from "@/hooks/useSolPrice";

const TOOLTIP =
  "SOL price from Binance, updates every 60s. Fiat values are approximate and for reference only.";

export default function FiatValue({ solAmount }: { solAmount: number }) {
  const { solPrice, loading } = useSolPrice();

  if (loading || solPrice === null) return null;

  const usdAmount = solAmount * solPrice;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      ~${usdAmount.toFixed(2)}
      <span className="group relative inline-flex">
        <span
          className="cursor-help text-[10px] leading-none opacity-70"
          aria-label={TOOLTIP}
          title={TOOLTIP}
        >
          ⓘ
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-[11px] leading-snug text-muted shadow-xl group-hover:block"
        >
          {TOOLTIP}
        </span>
      </span>
    </span>
  );
}
