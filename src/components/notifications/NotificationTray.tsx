"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type RefObject } from "react";

import NotificationRow from "@/components/notifications/NotificationRow";
import AnchoredPortal from "@/components/ui/AnchoredPortal";
import {
  markAllAsRead,
  markAsRead,
  getNotificationHref,
  type Notification,
} from "@/lib/notifications";

export default function NotificationTray({
  open,
  onClose,
  anchorRef,
  wallet,
  notifications,
  unreadCount,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  wallet: string;
  notifications: Notification[];
  unreadCount: number;
  onRefresh: () => Promise<void>;
}) {
  const router = useRouter();

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.is_read) {
        try {
          await markAsRead(notification.id);
          await onRefresh();
        } catch {
          // navigation still proceeds
        }
      }

      onClose();
      const href = getNotificationHref(notification);
      if (href) {
        router.push(href);
      }
    },
    [onClose, onRefresh, router]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead(wallet);
      await onRefresh();
    } catch {
      // ignore
    }
  }, [wallet, onRefresh]);

  return (
    <AnchoredPortal
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      align="end"
      className="flex w-[380px] flex-col overflow-hidden overflow-x-hidden rounded-2xl border border-white/10 bg-[#1a1835] shadow-2xl max-md:max-h-[70vh] max-md:overflow-y-auto md:max-w-[calc(100vw-1rem)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="shrink-0 text-xs font-medium text-purple-300 transition-colors hover:text-accent"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="min-h-0 overflow-x-hidden overflow-y-auto max-md:max-h-none md:max-h-[min(520px,calc(100vh-8rem))]">
        {notifications.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">
            No notifications yet
          </p>
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onClick={(item) => void handleNotificationClick(item)}
              compact
            />
          ))
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-purple-300 transition-colors hover:text-accent"
        >
          View all notifications →
        </Link>
      </div>
    </AnchoredPortal>
  );
}
