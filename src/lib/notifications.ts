import { logSupabaseError } from "@/lib/errors";
import { formatSol, shortenAddress } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";
import { getNotificationClient, supabase, type SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export type NotificationType =
  | "bid_placed"
  | "outbid"
  | "bid_received"
  | "auction_won"
  | "auction_ended"
  | "auction_no_sale"
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
  | "funds_released"
  | "transaction_complete"
  | "dispute_resolved"
  | "tracking_uploaded"
  | "listing_live";

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
  link: string,
  client: SupabaseClient = supabase
): Promise<boolean> {
  const { data, error } = await client
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
  link?: string | null,
  client?: SupabaseClient
): Promise<boolean> {
  const writeClient = client ?? getNotificationClient();

  try {
    await upsertUser(wallet, writeClient);
  } catch (error) {
    logSupabaseError("createNotification:upsertUser", error);
  }

  try {
    const { error } = await writeClient.from("notifications").insert({
      wallet_address: wallet,
      type,
      title,
      body,
      link: link ?? null,
      is_read: false,
    });

    if (error) {
      logSupabaseError("createNotification", error);
      return false;
    }

    return true;
  } catch (error) {
    logSupabaseError("createNotification", error);
    return false;
  }
}

export async function markAsRead(
  notificationId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllAsRead(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("wallet_address", wallet)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getNotifications(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<Notification[]> {
  const { data, error } = await client
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

export async function getUnreadCount(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<number> {
  const { count, error } = await client
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

    const [{ data: bidRows, error: bidsError }, { data: watchRows, error: watchError }] =
      await Promise.all([
        supabase
          .from("bids")
          .select("bidder_wallet")
          .eq("auction_id", auctionId),
        supabase
          .from("watchlist")
          .select("wallet_address")
          .eq("auction_id", auctionId),
      ]);

    if (bidsError) {
      logSupabaseError("checkEndingSoonNotifications:bids", bidsError);
      continue;
    }

    if (watchError) {
      logSupabaseError("checkEndingSoonNotifications:watchlist", watchError);
    }

    const uniqueRecipients = [
      ...new Set(
        [
          ...(bidRows ?? []).map((row) => row.bidder_wallet as string),
          ...(watchRows ?? []).map((row) => row.wallet_address as string),
        ].filter(Boolean)
      ),
    ];

    for (const recipientWallet of uniqueRecipients) {
      const alreadySent = await hasNotification(
        recipientWallet,
        "ending_soon",
        link
      );
      if (alreadySent) continue;

      await createNotification(
        recipientWallet,
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

  await Promise.all([
    createNotification(
      bidderWallet,
      "bid_placed",
      "Bid placed!",
      `You bid ${sol} on ${auctionTitle}`,
      link
    ),
    createNotification(
      sellerWallet,
      "bid_received",
      "New bid on your auction",
      `${bidderDisplayName} bid ${sol} on ${auctionTitle}`,
      link
    ),
    previousBidderWallet && previousBidderWallet !== bidderWallet
      ? createNotification(
          previousBidderWallet,
          "outbid",
          "You've been outbid!",
          `Someone bid ${sol} on ${auctionTitle}. Bid again to stay in the lead.`,
          link
        )
      : Promise.resolve(true),
  ]);
}

export async function notifySellerAuctionNoSale({
  sellerWallet,
  auctionTitle,
  auctionId,
}: {
  sellerWallet: string;
  auctionTitle: string;
  auctionId: string;
}): Promise<void> {
  const link = `/auction/${auctionId}`;
  const alreadySent = await hasNotification(
    sellerWallet,
    "auction_no_sale",
    link
  );
  if (alreadySent) return;

  await createNotification(
    sellerWallet,
    "auction_no_sale",
    "Auction ended with no sale",
    `Your auction "${auctionTitle}" ended without any bids.`,
    link
  );
}

export async function notifyAuctionWon({
  winnerWallet,
  auctionTitle,
  amount,
  threadId,
}: {
  winnerWallet: string;
  auctionTitle: string;
  amount: number;
  threadId: string;
}, client: SupabaseClient = supabase): Promise<void> {
  const link = `/messages/${threadId}`;
  const alreadySent = await hasNotification(
    winnerWallet,
    "auction_won",
    link,
    client
  );
  if (alreadySent) return;

  await createNotification(
    winnerWallet,
    "auction_won",
    "You won the auction!",
    `You won ${auctionTitle} with a bid of ${formatSol(amount)}.`,
    link,
    client
  );
}

export async function notifySellerAuctionEnded({
  sellerWallet,
  auctionTitle,
  winnerDisplayName,
  amount,
  threadId,
}: {
  sellerWallet: string;
  auctionTitle: string;
  winnerDisplayName: string;
  amount: number;
  threadId: string;
}, client: SupabaseClient = supabase): Promise<void> {
  const link = `/messages/${threadId}`;
  const alreadySent = await hasNotification(
    sellerWallet,
    "auction_ended",
    link,
    client
  );
  if (alreadySent) return;

  await createNotification(
    sellerWallet,
    "auction_ended",
    "Auction ended",
    `Your auction "${auctionTitle}" ended. Winner: ${winnerDisplayName} (${formatSol(amount)}).`,
    link,
    client
  );
}

export async function notifyPaymentConfirmed({
  buyerWallet,
  sellerWallet,
  auctionTitle,
  threadId,
  totalSol,
}: {
  buyerWallet: string;
  sellerWallet: string;
  auctionTitle: string;
  threadId: string;
  totalSol: number;
}): Promise<void> {
  const link = `/messages/${threadId}`;
  const total = formatSol(totalSol);

  await createNotification(
    buyerWallet,
    "payment_confirmed",
    "Payment secured! 🔒",
    `Your payment of ${total} for ${auctionTitle} is locked in escrow. The seller will ship soon.`,
    link
  );

  await createNotification(
    sellerWallet,
    "payment_confirmed",
    "Payment received! 💰",
    `${total} has been secured in escrow for ${auctionTitle}. Please ship the item and upload tracking.`,
    link
  );
}

export async function notifyTransactionComplete({
  buyerWallet,
  auctionTitle,
  threadId,
}: {
  buyerWallet: string;
  auctionTitle: string;
  threadId: string;
}): Promise<void> {
  const link = `/messages/${threadId}`;
  const alreadySent = await hasNotification(
    buyerWallet,
    "transaction_complete",
    link
  );
  if (alreadySent) return;

  await createNotification(
    buyerWallet,
    "transaction_complete",
    "Transaction complete",
    `You confirmed receipt of ${auctionTitle}. Funds have been released to the seller. This order is now complete.`,
    link
  );
}

export async function notifyItemShipped({
  buyerWallet,
  auctionTitle,
  courier,
  trackingNumber,
  threadId,
}: {
  buyerWallet: string;
  auctionTitle: string;
  courier: string;
  trackingNumber: string;
  threadId: string;
}): Promise<void> {
  await createNotification(
    buyerWallet,
    "item_shipped",
    "Your item has been shipped!",
    `${auctionTitle} is on its way. Tracking: ${trackingNumber} via ${courier}`,
    `/messages/${threadId}`
  );
}

export async function notifyTrackingUploaded({
  sellerWallet,
  threadId,
}: {
  sellerWallet: string;
  threadId: string;
}): Promise<void> {
  const link = `/messages/${threadId}`;
  const alreadySent = await hasNotification(
    sellerWallet,
    "tracking_uploaded",
    link
  );
  if (alreadySent) return;

  await createNotification(
    sellerWallet,
    "tracking_uploaded",
    "Tracking uploaded",
    "Shipment recorded on-chain. The buyer has been notified.",
    link
  );
}

export async function notifyListingLive({
  sellerWallet,
  auctionTitle,
  categoryLabel,
  auctionId,
}: {
  sellerWallet: string;
  auctionTitle: string;
  categoryLabel: string;
  auctionId: string;
}): Promise<void> {
  const link = `/auction/${auctionId}`;
  const alreadySent = await hasNotification(sellerWallet, "listing_live", link);
  if (alreadySent) return;

  await createNotification(
    sellerWallet,
    "listing_live",
    "Your listing is live! 🚀",
    `${categoryLabel} — ${auctionTitle} is now live on Hype Auction.`,
    link
  );
}

export async function notifyFundsReleased({
  sellerWallet,
  auctionTitle,
  amount,
  threadId,
}: {
  sellerWallet: string;
  auctionTitle: string;
  amount: number;
  threadId: string;
}): Promise<void> {
  const link = `/messages/${threadId}`;
  const alreadySent = await hasNotification(sellerWallet, "funds_released", link);
  if (alreadySent) return;

  await createNotification(
    sellerWallet,
    "funds_released",
    "Funds released! 💰",
    `The buyer confirmed receipt for ${auctionTitle}. ${formatSol(amount)} has been released to your wallet.`,
    link
  );
}

export async function notifyDisputeResolved({
  buyerWallet,
  sellerWallet,
  auctionTitle,
  sellerWins,
  threadId,
}: {
  buyerWallet: string;
  sellerWallet: string;
  auctionTitle: string;
  sellerWins: boolean;
  threadId: string | null;
}): Promise<void> {
  const link = threadId ? `/messages/${threadId}` : null;

  if (sellerWins) {
    await createNotification(
      sellerWallet,
      "dispute_resolved",
      "Dispute resolved in your favor",
      `Admin resolved the dispute for ${auctionTitle}. Funds were released to you.`,
      link
    );
    await createNotification(
      buyerWallet,
      "dispute_resolved",
      "Dispute resolved",
      `The dispute for ${auctionTitle} was resolved in the seller's favor.`,
      link
    );
  } else {
    await createNotification(
      buyerWallet,
      "dispute_resolved",
      "Dispute resolved in your favor",
      `Admin resolved the dispute for ${auctionTitle}. Your payment has been refunded.`,
      link
    );
    await createNotification(
      sellerWallet,
      "dispute_resolved",
      "Dispute resolved",
      `The dispute for ${auctionTitle} was resolved in the buyer's favor.`,
      link
    );
  }
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
