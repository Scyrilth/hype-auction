"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import NotificationRow from "@/components/notifications/NotificationRow";
import NotificationsEmptyState from "@/components/notifications/NotificationsEmptyState";
import BackButton from "@/components/ui/BackButton";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markAllAsRead,
  markAsRead,
  getNotificationHref,
  type Notification,
} from "@/lib/notifications";

function getDateGroup(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Older";

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
  const { publicKey, connected } = useWallet();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    mounted,
    refresh,
    isConnected,
  } = useNotifications();

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
    try {
      await markAllAsRead(wallet);
      await refresh();
    } catch {
      // keep list visible
    }
  }, [publicKey, refresh]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.is_read) {
        try {
          await markAsRead(notification.id);
          await refresh();
        } catch {
          // navigation still proceeds
        }
      }
      const href = getNotificationHref(notification);
      if (href) {
        router.push(href);
      }
    },
    [refresh, router]
  );

  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackButton className="mb-4" />
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <p className="text-sm text-muted">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton className="mb-4" />

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {isConnected && unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="shrink-0 rounded-full border border-white/10 bg-[#1a1835] px-4 py-2 text-xs font-semibold text-purple-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Mark all read
          </button>
        )}
      </div>

      {!connected || !publicKey ? (
        <NotificationsEmptyState
          title="Connect your wallet to see notifications"
          subtitle="Activity from bids, messages, and auctions will appear here once you are signed in."
        />
      ) : loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <p className="text-sm text-muted">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <p className="text-sm font-medium text-white">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-purple-300 transition-colors hover:border-accent/50 hover:text-white"
          >
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <NotificationsEmptyState
          title="No notifications yet"
          subtitle="Activity from bids, messages, and auctions will appear here."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835]">
                {group.items.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={
                      index === group.items.length - 1 ? "" : "border-b border-white/5"
                    }
                  >
                    <NotificationRow
                      notification={notification}
                      onClick={(item) => void handleNotificationClick(item)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
