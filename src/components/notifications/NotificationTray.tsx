"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, type RefObject } from "react";

import NotificationRow from "@/components/notifications/NotificationRow";
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

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onClose, anchorRef]);

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

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1835] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="text-xs font-medium text-purple-300 transition-colors hover:text-accent"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[520px] overflow-y-auto">
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
    </div>
  );
}
