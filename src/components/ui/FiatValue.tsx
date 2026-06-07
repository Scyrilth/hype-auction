"use client";

import { useState } from "react";

import { useSolPrice } from "@/hooks/useSolPrice";

const TOOLTIP =
  "SOL price from Binance, updates every 60s. Fiat values are approximate and for reference only.";

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: 0,
  background: "#1a1835",
  border: "1px solid #7c3aed",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  whiteSpace: "nowrap",
  zIndex: 9999,
  marginBottom: "4px",
};

export default function FiatValue({
  solAmount,
  showTooltip = true,
}: {
  solAmount: number;
  showTooltip?: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  const { solPrice, loading } = useSolPrice();

  if (loading || solPrice === null || solPrice <= 0) return null;

  const usdAmount = solAmount * solPrice;
  if (!Number.isFinite(usdAmount) || usdAmount < 0) return null;

  return (
    <span
      className="text-xs text-muted"
      style={wrapperStyle}
      onMouseEnter={() => {
        if (showTooltip) setShowTip(true);
      }}
      onMouseLeave={() => setShowTip(false)}
    >
      <span>~${usdAmount.toFixed(2)}</span>
      {showTooltip && (
        <>
          <span
            className="inline-flex shrink-0 cursor-help items-center justify-center rounded border border-purple-500/50 bg-[#1a1835] p-0.5 text-gray-400"
            aria-label={TOOLTIP}
          >
            <i
              className="ti ti-info-circle"
              style={{ fontSize: "12px", lineHeight: 1, display: "block" }}
            />
          </span>
          {showTip && (
            <span role="tooltip" style={tooltipStyle}>
              {TOOLTIP}
            </span>
          )}
        </>
      )}
    </span>
  );
}
