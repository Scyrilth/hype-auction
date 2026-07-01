export type ViewMode = "admin" | "seller" | "buyer" | "default";

export const VIEW_MODE_STORAGE_KEY = "hype-view-mode";

export const VIEW_MODE_CHANGE_EVENT = "hype-view-mode-change";

export function getViewModeFromPath(pathname: string): ViewMode {
  if (pathname.startsWith("/admin")) return "admin";

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/shop/") ||
    pathname === "/transactions" ||
    pathname.startsWith("/transactions/")
  ) {
    return "seller";
  }

  if (pathname.startsWith("/profile") || pathname.startsWith("/collections")) {
    return "buyer";
  }

  return "default";
}

export function readStoredViewMode(): ViewMode | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (value === "admin" || value === "seller" || value === "buyer") {
    return value;
  }

  return null;
}

export function writeStoredViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") return;

  if (mode === "default") {
    localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
  } else {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }

  window.dispatchEvent(new Event(VIEW_MODE_CHANGE_EVENT));
}

export function getSidebarViewMode(
  pathname: string,
  storedMode: ViewMode | null
): ViewMode {
  const pathMode = getViewModeFromPath(pathname);
  if (pathMode !== "default") return pathMode;

  // Admin mode is for /admin surfaces; don't let a stored admin pill hide vendor nav elsewhere.
  if (storedMode === "admin" && !pathname.startsWith("/admin")) {
    return "default";
  }

  return storedMode ?? "default";
}

export function getActiveViewModePill(
  pathname: string,
  storedMode: ViewMode | null
): ViewMode | null {
  const pathMode = getViewModeFromPath(pathname);
  if (pathMode !== "default") return pathMode;
  return storedMode;
}

export function shouldShowMyShopInSidebar(
  sidebarMode: ViewMode,
  connected: boolean,
  isVendor: boolean
): boolean {
  if (!connected || !isVendor) return false;
  if (sidebarMode === "admin") return false;
  return true;
}

export function shouldShowMyCollectionsInSidebar(
  sidebarMode: ViewMode,
  connected: boolean,
  hasWallet: boolean
): boolean {
  if (!connected || !hasWallet) return false;
  return (
    sidebarMode === "buyer" ||
    sidebarMode === "seller" ||
    sidebarMode === "default"
  );
}
