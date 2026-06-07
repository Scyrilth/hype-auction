"use client";

import NotificationsErrorBoundary from "@/components/notifications/NotificationsErrorBoundary";
import NotificationsView from "@/components/notifications/NotificationsView";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function NotificationsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d1a]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto bg-[#0d0d1a] p-4 sm:p-5">
          <NotificationsErrorBoundary>
            <NotificationsView />
          </NotificationsErrorBoundary>
        </main>
      </div>
    </div>
  );
}
