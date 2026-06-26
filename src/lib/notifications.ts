import { logSupabaseError } from "@/lib/errors";
import { formatSol, shortenAddress } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";
import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "bid_placed"
  | "outbid"
  | "bid_received"
  | "auction_won"
  | "item_shipped"
  | "ending_soon"
  | "new_follower"
  | "new_message"
  | "next_bidder_offer"
  | "winner_declined"
  | "item_relisted"
  | "action_required_unpaid"
  | "offer_sent_confirmation"
  | "payment_confirmed"
  | "tracking_uploaded";

export interface Notification {
  id: string;
  wallet_address: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function parseNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    wallet_address: row.wallet_address as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: row.body as string,
    link: (row.link as string | null) ?? null,
    is_read: Boolean(row.is_read),
    created_at: row.created_at as string,
  };
}

const DASHBOARD_NOTIFICATION_TYPES: NotificationType[] = [
  "action_required_unpaid",
  "winner_declined",
];

/** Resolve the in-app path for a notification click. */
export function getNotificationHref(notification: Notification): string | null {
  if (DASHBOARD_NOTIFICATION_TYPES.includes(notification.type)) {
    return "/dashboard";
  }

  const link = notification.link?.trim();
  return link || null;
}

export async function getUserDisplayName(wallet: string): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (error) {
    logSupabaseError("getUserDisplayName", error);
    return shortenAddress(wallet, 4);
  }

  const username = data?.username as string | null | undefined;
  return username?.trim() ? `@${username.trim()}` : shortenAddress(wallet, 4);
}

async function hasNotification(
  wallet: string,
  type: NotificationType,
  link: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("wallet_address", wallet)
    .eq("type", type)
    .eq("link", link)
    .limit(1)
    .maybeSingle();

  if (error) {
    logSupabaseError("hasNotification", error);
    return false;
  }

  return Boolean(data);
}

export async function hasNotificationForAuction(
  wallet: string,
  type: NotificationType,
  link: string
): Promise<boolean> {
  return hasNotification(wallet, type, link);
}

export async function createNotification(
  wallet: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string | null
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      wallet_address: wallet,
      type,
      title,
      body,
      link: link ?? null,
      is_read: false,
    });

    if (error) logSupabaseError("createNotification", error);
  } catch (error) {
    logSupabaseError("createNotification", error);
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllAsRead(wallet: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("wallet_address", wallet)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getNotifications(wallet: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("wallet_address", wallet)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logSupabaseError("getNotifications", error);
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      try {
        return parseNotification(row as Record<string, unknown>);
      } catch (parseError) {
        logSupabaseError("parseNotification", parseError);
        return null;
      }
    })
    .filter((item): item is Notification => item !== null);
}

export async function getUnreadCount(wallet: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("wallet_address", wallet)
    .eq("is_read", false);

  if (error) {
    logSupabaseError("getUnreadCount", error);
    throw error;
  }

  return count ?? 0;
}

export async function checkEndingSoonNotifications(): Promise<void> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const oneHourLater = new Date(now + 60 * 60 * 1000).toISOString();

  const { data: auctions, error } = await supabase
    .from("auctions")
    .select("id, title, end_time")
    .eq("status", "live")
    .gt("end_time", nowIso)
    .lt("end_time", oneHourLater);

  if (error) {
    logSupabaseError("checkEndingSoonNotifications", error);
    return;
  }

  if (!auctions?.length) return;

  for (const auction of auctions) {
    const auctionId = auction.id as string;
    const title = auction.title as string;
    const link = `/auction/${auctionId}`;

    const { data: bidRows, error: bidsError } = await supabase
      .from("bids")
      .select("bidder_wallet")
      .eq("auction_id", auctionId);

    if (bidsError) {
      logSupabaseError("checkEndingSoonNotifications:bids", bidsError);
      continue;
    }

    const uniqueBidders = [
      ...new Set(
        (bidRows ?? []).map((row) => row.bidder_wallet as string).filter(Boolean)
      ),
    ];

    for (const bidderWallet of uniqueBidders) {
      const alreadySent = await hasNotification(
        bidderWallet,
        "ending_soon",
        link
      );
      if (alreadySent) continue;

      await createNotification(
        bidderWallet,
        "ending_soon",
        "Auction ending soon!",
        `${title} ends in less than 1 hour.`,
        link
      );
    }
  }
}

export async function notifyBidPlaced({
  bidderWallet,
  sellerWallet,
  previousBidderWallet,
  auctionId,
  auctionTitle,
  amount,
  bidderDisplayName,
}: {
  bidderWallet: string;
  sellerWallet: string;
  previousBidderWallet: string | null;
  auctionId: string;
  auctionTitle: string;
  amount: number;
  bidderDisplayName: string;
}): Promise<void> {
  const link = `/auction/${auctionId}`;
  const sol = formatSol(amount);

  await createNotification(
    bidderWallet,
    "bid_placed",
    "Bid placed!",
    `You bid ${sol} on ${auctionTitle}`,
    link
  );

  await createNotification(
    sellerWallet,
    "bid_received",
    "New bid on your auction",
    `${bidderDisplayName} bid ${sol} on ${auctionTitle}`,
    link
  );

  if (
    previousBidderWallet &&
    previousBidderWallet !== bidderWallet
  ) {
    await createNotification(
      previousBidderWallet,
      "outbid",
      "You've been outbid!",
      `Someone bid ${sol} on ${auctionTitle}. Bid again to stay in the lead.`,
      link
    );
  }
}

export async function notifyAuctionWon({
  winnerWallet,
  auctionTitle,
  amount,
  auctionId,
}: {
  winnerWallet: string;
  auctionTitle: string;
  amount: number;
  auctionId: string;
}): Promise<void> {
  await createNotification(
    winnerWallet,
    "auction_won",
    "You won the auction!",
    `You won ${auctionTitle} with a bid of ${formatSol(amount)}.`,
    `/auction/${auctionId}`
  );
}

export async function notifyPaymentConfirmed({
  buyerWallet,
  sellerWallet,
  auctionTitle,
  threadId,
}: {
  buyerWallet: string;
  sellerWallet: string;
  auctionTitle: string;
  threadId: string;
}): Promise<void> {
  const link = `/messages/${threadId}`;

  await createNotification(
    buyerWallet,
    "payment_confirmed",
    "Payment confirmed",
    `Your payment for ${auctionTitle} is secured in escrow.`,
    link
  );

  await createNotification(
    sellerWallet,
    "payment_confirmed",
    "Payment received",
    `Payment for ${auctionTitle} has been secured in escrow.`,
    link
  );
}

export async function notifyItemShipped({
  buyerWallet,
  sellerDisplayName,
  auctionTitle,
  courier,
  trackingNumber,
  threadId,
}: {
  buyerWallet: string;
  sellerDisplayName: string;
  auctionTitle: string;
  courier: string;
  trackingNumber: string;
  threadId: string;
}): Promise<void> {
  await createNotification(
    buyerWallet,
    "tracking_uploaded",
    "Tracking uploaded",
    `${sellerDisplayName} shipped ${auctionTitle} via ${courier}. Tracking: ${trackingNumber}`,
    `/messages/${threadId}`
  );
}

export async function notifyNewFollower({
  followingWallet,
  followerWallet,
}: {
  followingWallet: string;
  followerWallet: string;
}): Promise<void> {
  const [followerUser, followerDisplayName] = await Promise.all([
    supabase
      .from("users")
      .select("username")
      .eq("wallet_address", followerWallet)
      .maybeSingle(),
    getUserDisplayName(followerWallet),
  ]);

  const link = getProfileHref(
    (followerUser.data?.username as string | null) ?? null,
    followerWallet
  );

  await createNotification(
    followingWallet,
    "new_follower",
    "New follower!",
    `${followerDisplayName} is now following you.`,
    link
  );
}

export async function notifyNewMessage({
  recipientWallet,
  senderDisplayName,
  preview,
  threadId,
}: {
  recipientWallet: string;
  senderDisplayName: string;
  preview: string;
  threadId: string;
}): Promise<void> {
  const trimmedPreview =
    preview.length > 80 ? `${preview.slice(0, 77)}...` : preview;

  await createNotification(
    recipientWallet,
    "new_message",
    "New message",
    `${senderDisplayName}: ${trimmedPreview}`,
    `/messages/${threadId}`
  );
}
