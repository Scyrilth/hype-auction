"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import NotificationRow from "@/components/notifications/NotificationRow";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markAllAsRead,
  markAsRead,
  type Notification,
} from "@/lib/notifications";

function getDateGroup(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This week";
  return "Older";
}

export default function NotificationsView() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { notifications, unreadCount, refresh } = useNotifications();

  const grouped = useMemo(() => {
    const groups = new Map<string, Notification[]>();
    const order = ["Today", "Yesterday", "This week", "Older"];

    for (const notification of notifications) {
      const label = getDateGroup(notification.created_at);
      const existing = groups.get(label) ?? [];
      existing.push(notification);
      groups.set(label, existing);
    }

    return order
      .filter((label) => groups.has(label))
      .map((label) => ({ label, items: groups.get(label)! }));
  }, [notifications]);

  const handleMarkAllRead = useCallback(async () => {
    const wallet = publicKey?.toBase58();
    if (!wallet) return;
    await markAllAsRead(wallet);
    await refresh();
  }, [publicKey, refresh]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
        await refresh();
      }
      if (notification.link) {
        router.push(notification.link);
      }
    },
    [refresh, router]
  );

  if (!publicKey) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        Connect your wallet to view notifications.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835]">
                {group.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={(item) => void handleNotificationClick(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
