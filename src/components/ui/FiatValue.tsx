"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useSolPrice } from "@/hooks/useSolPrice";

const TOOLTIP =
  "SOL price from Binance, updates every 60s. Fiat values are approximate and for reference only.";

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

export default function FiatValue({
  solAmount,
  showTooltip = true,
}: {
  solAmount: number;
  showTooltip?: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const { solPrice, loading } = useSolPrice();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || solPrice === null || solPrice <= 0) return null;

  const usdAmount = solAmount * solPrice;
  if (!Number.isFinite(usdAmount) || usdAmount < 0) return null;

  const tooltip =
    mounted && showTip && showTooltip
      ? createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.y - 60,
              left: pos.x - 100,
              background: "#1a1835",
              border: "1px solid #7c3aed",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              whiteSpace: "nowrap",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            {TOOLTIP}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        className="pointer-events-auto text-xs text-muted"
        style={wrapperStyle}
        onMouseEnter={(event) => {
          console.log("[FiatValue] mouseEnter");
          setPos({ x: event.clientX, y: event.clientY });
          if (showTooltip) setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
        onMouseMove={(event) => {
          setPos({ x: event.clientX, y: event.clientY });
        }}
      >
        <span>~${usdAmount.toFixed(2)}</span>
        {showTooltip && (
          <span
            className="inline-flex shrink-0 cursor-help items-center justify-center rounded border border-purple-500/50 bg-[#1a1835] p-0.5 text-gray-400"
            aria-label={TOOLTIP}
          >
            <i
              className="ti ti-info-circle"
              style={{ fontSize: "12px", lineHeight: 1, display: "block" }}
            />
          </span>
        )}
      </span>
      {tooltip}
    </>
  );
}
