"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 400;
const VIEWPORT_PADDING = 8;

function clampPopoverPosition(
  anchor: DOMRect,
  popoverHeight: number
): { top: number; left: number } {
  const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_PADDING;
  const left = Math.max(
    VIEWPORT_PADDING,
    Math.min(anchor.left, maxLeft)
  );

  const spaceBelow = window.innerHeight - anchor.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchor.top - VIEWPORT_PADDING;
  const showAbove =
    spaceBelow < Math.min(popoverHeight, POPOVER_MAX_HEIGHT) + 8 &&
    spaceAbove > spaceBelow;

  const top = showAbove
    ? Math.max(
        VIEWPORT_PADDING,
        anchor.top - Math.min(popoverHeight, POPOVER_MAX_HEIGHT) - 8
      )
    : Math.min(
        window.innerHeight - POPOVER_MAX_HEIGHT - VIEWPORT_PADDING,
        anchor.bottom + 8
      );

  return { top, left };
}

export default function AuctionCardLink({
  href,
  description,
  className = "",
  style,
  children,
}: {
  href: string;
  description?: string | null;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const trimmedDescription = description?.trim() ?? "";
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    if (!anchor) return;

    const popoverHeight =
      popoverRef.current?.getBoundingClientRect().height ??
      POPOVER_MAX_HEIGHT;

    setPosition(clampPopoverPosition(anchor, popoverHeight));
  }, []);

  const showPopover = useCallback(() => {
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  }, [clearCloseTimer, updatePosition]);

  const scheduleHidePopover = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  if (!trimmedDescription) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  const popover =
    mounted && open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            className="fixed z-[9999] w-[320px] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-accent/40 bg-[#141028] p-3 text-sm leading-relaxed text-gray-200 shadow-xl shadow-black/40"
            style={{
              top: position.top,
              left: position.left,
              maxHeight: POPOVER_MAX_HEIGHT,
            }}
            onMouseEnter={showPopover}
            onMouseLeave={scheduleHidePopover}
          >
            {trimmedDescription}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className="relative h-full"
      onMouseEnter={showPopover}
      onMouseLeave={scheduleHidePopover}
    >
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
      {popover}
    </div>
  );
}
