"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminEscrowMonitor from "@/components/admin/AdminEscrowMonitor";
import AdminFlaggedOrders from "@/components/admin/AdminFlaggedOrders";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminUserManagement from "@/components/admin/AdminUserManagement";

import { AdminProvider, useAdminContext } from "./AdminContext";

function AdminContent() {
  const { publicKey } = useWallet();
  const { activeTab } = useAdminContext();
  const wallet = publicKey?.toBase58() ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar wallet={wallet} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "flagged" && <AdminFlaggedOrders />}
          {activeTab === "disputes" && <AdminDisputes />}
          {activeTab === "escrow" && <AdminEscrowMonitor />}
          {activeTab === "users" && <AdminUserManagement />}
        </main>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
