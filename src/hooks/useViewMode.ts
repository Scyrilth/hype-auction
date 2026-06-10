"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  VIEW_MODE_CHANGE_EVENT,
  getActiveViewModePill,
  getSidebarViewMode,
  getViewModeFromPath,
  readStoredViewMode,
  writeStoredViewMode,
  type ViewMode,
} from "@/lib/view-mode";

export function useViewMode() {
  const pathname = usePathname();
  const [storedMode, setStoredMode] = useState<ViewMode | null>(null);

  const refreshStoredMode = useCallback(() => {
    setStoredMode(readStoredViewMode());
  }, []);

  useEffect(() => {
    refreshStoredMode();
  }, [refreshStoredMode]);

  useEffect(() => {
    const onChange = () => refreshStoredMode();
    window.addEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(VIEW_MODE_CHANGE_EVENT, onChange);
  }, [refreshStoredMode]);

  useEffect(() => {
    const pathMode = getViewModeFromPath(pathname);
    if (pathMode !== "default") {
      writeStoredViewMode(pathMode);
      setStoredMode(pathMode);
    }
  }, [pathname]);

  const sidebarMode = useMemo(
    () => getSidebarViewMode(pathname, storedMode),
    [pathname, storedMode]
  );

  const activePill = useMemo(
    () => getActiveViewModePill(pathname, storedMode),
    [pathname, storedMode]
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    writeStoredViewMode(mode);
    setStoredMode(mode === "default" ? null : mode);
  }, []);

  const exitAdminMode = useCallback(() => {
    setViewMode("default");
  }, [setViewMode]);

  return {
    sidebarMode,
    activePill,
    setViewMode,
    exitAdminMode,
  };
}
