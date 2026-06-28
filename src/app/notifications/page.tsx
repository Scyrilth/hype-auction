"use client";

import NotificationsErrorBoundary from "@/components/notifications/NotificationsErrorBoundary";
import NotificationsView from "@/components/notifications/NotificationsView";
import AppShell from "@/components/layout/AppShell";

export default function NotificationsPage() {
  return (
    <AppShell
      shellClassName="bg-[#0d0d1a]"
      contentClassName="flex-1 overflow-y-auto bg-[#0d0d1a] p-3 sm:p-4"
    >
      <NotificationsErrorBoundary>
        <NotificationsView />
      </NotificationsErrorBoundary>
    </AppShell>
  );
}
