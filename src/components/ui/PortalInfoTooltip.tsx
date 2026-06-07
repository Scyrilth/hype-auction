"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PortalInfoTooltip({
  text,
  className = "",
  multiline = false,
}: {
  text: string;
  className?: string;
  multiline?: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tooltip =
    mounted && showTip
      ? createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.y - (multiline ? 88 : 60),
              left: Math.max(8, pos.x - (multiline ? 140 : 100)),
              background: "#1a1835",
              border: "1px solid #7c3aed",
              color: "white",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              whiteSpace: multiline ? "normal" : "nowrap",
              maxWidth: multiline ? 280 : undefined,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            {text}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        className={`inline-flex shrink-0 cursor-help items-center justify-center rounded border border-purple-500/50 bg-[#1a1835] p-0.5 text-gray-400 ${className}`}
        aria-label={text}
        onMouseEnter={(event) => {
          setPos({ x: event.clientX, y: event.clientY });
          setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
        onMouseMove={(event) => {
          setPos({ x: event.clientX, y: event.clientY });
        }}
      >
        <i
          className="ti ti-info-circle"
          style={{ fontSize: "12px", lineHeight: 1, display: "block" }}
        />
      </span>
      {tooltip}
    </>
  );
}
