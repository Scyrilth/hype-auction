"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type Align = "end" | "start";

const MOBILE_MAX_WIDTH = "(max-width: 767px)";
const MOBILE_VIEWPORT_INSET_PX = 8;

/** Shared mobile-safe panel classes for TopNav dropdowns. */
export const TOPNAV_PORTAL_MOBILE_CLASS =
  "max-md:max-w-[calc(100vw-2rem)] max-md:w-[calc(100vw-2rem)] max-md:overflow-x-hidden";

export default function AnchoredPortal({
  open,
  onClose,
  anchorRef,
  children,
  align = "end",
  offset = 8,
  className = "",
  style,
  viewportSafeOnMobile = true,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: Align;
  offset?: number;
  className?: string;
  style?: CSSProperties;
  viewportSafeOnMobile?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MAX_WIDTH);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + offset,
      left: align === "end" ? rect.right : rect.left,
    });
  }, [align, anchorRef, offset]);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleUpdate = () => updatePosition();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [anchorRef, onClose, open]);

  if (!open || !mounted || typeof document === "undefined") return null;

  const useMobileLayout = viewportSafeOnMobile && isMobile;

  const panelStyle: CSSProperties = useMobileLayout
    ? {
        position: "fixed",
        top: position.top,
        right: MOBILE_VIEWPORT_INSET_PX,
        left: "auto",
        width: "calc(100vw - 2rem)",
        maxWidth: "calc(100vw - 2rem)",
        overflowX: "hidden",
        zIndex: 9999,
        ...style,
      }
    : {
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: align === "end" ? "translateX(-100%)" : undefined,
        maxWidth: "calc(100vw - 1rem)",
        zIndex: 9999,
        ...style,
      };

  return createPortal(
    <div
      ref={panelRef}
      className={`pointer-events-auto ${TOPNAV_PORTAL_MOBILE_CLASS} ${className}`.trim()}
      style={panelStyle}
    >
      {children}
    </div>,
    document.body
  );
}
