"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AdminTab } from "@/lib/admin/types";

interface AdminContextValue {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  showDummyData: boolean;
  setShowDummyData: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  children,
  initialTab = "overview",
}: {
  children: ReactNode;
  initialTab?: AdminTab;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [showDummyData, setShowDummyData] = useState(false);

  const value = useMemo(
    () => ({ activeTab, setActiveTab, showDummyData, setShowDummyData }),
    [activeTab, showDummyData]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return ctx;
}
