"use client";

import { formatTimeAgo } from "@/lib/format";
import type { Notification, NotificationType } from "@/lib/notifications";

const TYPE_ICONS: Record<NotificationType, string> = {
  bid_placed: "ti-bolt",
  bid_received: "ti-arrow-up",
  outbid: "ti-arrow-down",
  auction_won: "ti-trophy",
  auction_ended: "ti-flag",
  auction_no_sale: "ti-flag",
  item_shipped: "ti-truck",
  ending_soon: "ti-clock",
  new_follower: "ti-user-plus",
  new_message: "ti-message",
  next_bidder_offer: "ti-gift",
  winner_declined: "ti-user-x",
  item_relisted: "ti-refresh",
  action_required_unpaid: "ti-alert-triangle",
  offer_sent_confirmation: "ti-send",
  payment_confirmed: "ti-circle-check",
  funds_released: "ti-cash",
  transaction_complete: "ti-circle-check",
  dispute_resolved: "ti-scale",
  tracking_uploaded: "ti-truck",
  listing_live: "ti-rocket",
  ship_reminder: "ti-package",
  bundle_shipped: "ti-packages",
};

export default function NotificationRow({
  notification,
  onClick,
  compact = false,
}: {
  notification: Notification;
  onClick: (notification: Notification) => void;
  compact?: boolean;
}) {
  const icon = TYPE_ICONS[notification.type] ?? "ti-bell";

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
        notification.is_read
          ? "bg-transparent"
          : "border-l-2 border-l-accent bg-white/[0.03]"
      } ${compact ? "" : "sm:px-5"}`}
    >
      {!notification.is_read && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
          aria-hidden
        />
      )}
      {notification.is_read && <span className="w-2 shrink-0" aria-hidden />}

      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <i className={`ti ${icon} text-base leading-none`} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <span className="shrink-0 text-[11px] text-muted">
            {formatTimeAgo(notification.created_at)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
          {notification.body}
        </p>
      </div>
    </button>
  );
}
