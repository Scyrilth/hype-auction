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

export default function AnchoredPortal({
  open,
  onClose,
  anchorRef,
  children,
  align = "end",
  offset = 8,
  className = "",
  style,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: Align;
  offset?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

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
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: align === "end" ? "translateX(-100%)" : undefined,
        zIndex: 9999,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
