import type { AnchorProvider } from "@coral-xyz/anchor";

import type { Auction } from "@/lib/database.types";
import { confirmReceiptOnChain } from "@/lib/escrow";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { logSupabaseError, getErrorMessage, TX_FAILED_OR_CANCELLED_MESSAGE } from "@/lib/errors";
import { parseAuctionRow } from "@/lib/parse-auction";
import {
  getUserDisplayName,
  notifyNewMessage,
} from "@/lib/notifications";
import { supabase, type SupabaseClient } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

export type ThreadStatus = "active" | "archived";
export type MessagesTab = "buying" | "selling" | "archived";

export interface MessageThread {
  id: string;
  auction_id: string | null;
  buyer_wallet: string;
  seller_wallet: string;
  status: ThreadStatus;
  confirmed_at: string | null;
  archive_at: string | null;
  created_at: string;
  escrow_status?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
}

export interface DirectMessage {
  id: string;
  thread_id: string;
  sender_wallet: string;
  content: string;
  /** Unnormalized DB value — may be a JSON object for auction_summary messages. */
  rawContent?: unknown;
  is_system: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ThreadParticipant {
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ThreadListItem extends MessageThread {
  auction: Pick<Auction, "id" | "title" | "image_url" | "status"> | null;
  other_party: ThreadParticipant;
  last_message: DirectMessage | null;
  unread_count: number;
}

export interface ThreadDetail extends MessageThread {
  auction: Auction | null;
  top_bidder_wallet: string | null;
  buyer: ThreadParticipant;
  seller: ThreadParticipant;
  messages: EnrichedDirectMessage[];
}

export interface EnrichedDirectMessage extends DirectMessage {
  sender_username: string | null;
  sender_avatar: string | null;
}

function parseThread(row: Record<string, unknown>): MessageThread {
  return {
    id: row.id as string,
    auction_id: (row.auction_id as string | null) ?? null,
    buyer_wallet: row.buyer_wallet as string,
    seller_wallet: row.seller_wallet as string,
    status: row.status as ThreadStatus,
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    archive_at: (row.archive_at as string | null) ?? null,
    created_at: row.created_at as string,
    escrow_status: (row.escrow_status as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    carrier: (row.carrier as string | null) ?? null,
    shipped_at: (row.shipped_at as string | null) ?? null,
  };
}

function normalizeMessageContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value ?? "");
}

function parseDirectMessage(row: Record<string, unknown>): DirectMessage {
  const rawContent = row.content;
  return {
    id: row.id as string,
    thread_id: row.thread_id as string,
    sender_wallet: row.sender_wallet as string,
    content: normalizeMessageContent(rawContent),
    rawContent,
    is_system: Boolean(row.is_system),
    is_read: Boolean(row.is_read),
    created_at: row.created_at as string,
  };
}

export function formatOrderRef(auctionId: string | null): string {
  if (!auctionId) return "General Inquiry";
  return `#${auctionId.slice(0, 8)}`;
}

const MESSAGE_PREVIEW_MAX = 60;

function tryParseMessageJson(
  value: unknown
): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

/** Readable one-line preview for thread list rows. */
export function formatMessagePreview(
  content: string,
  rawContent?: unknown
): string {
  const parsed =
    tryParseMessageJson(rawContent) ?? tryParseMessageJson(content);

  if (parsed) {
    const type = parsed.type;

    if (type === "auction_summary") {
      const title =
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : "Auction";
      return `Auction: ${title}`;
    }

    if (type === "payment_confirmation") {
      return "Payment confirmed";
    }

    if (type === "tracking_update") {
      return "Tracking uploaded";
    }

    if (type === "next_bidder_offer") {
      return "You've been offered this item";
    }

    if (type === "system") {
      const message =
        typeof parsed.message === "string" ? parsed.message.trim() : "";
      if (message) {
        return message.length > MESSAGE_PREVIEW_MAX
          ? `${message.slice(0, MESSAGE_PREVIEW_MAX)}…`
          : message;
      }
      return "New message";
    }

    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const message =
      typeof parsed.message === "string" ? parsed.message.trim() : "";
    const fallback = title || message || "New message";
    return fallback.length > MESSAGE_PREVIEW_MAX
      ? `${fallback.slice(0, MESSAGE_PREVIEW_MAX)}…`
      : fallback;
  }

  const plain = (typeof rawContent === "string" ? rawContent : content).trim();
  if (!plain) return "No messages yet";
  return plain.length > MESSAGE_PREVIEW_MAX
    ? `${plain.slice(0, MESSAGE_PREVIEW_MAX)}…`
    : plain;
}

export function formatReferenceLabel(referenceNumber: string | null): string | null {
  if (!referenceNumber) return null;
  return referenceNumber;
}

export async function getAuctionThreadId(
  auctionId: string,
  buyerWallet: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", buyerWallet)
    .maybeSingle();

  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

export async function checkAndArchiveThreads(
  client: SupabaseClient = supabase
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await client
    .from("message_threads")
    .update({ status: "archived" })
    .eq("status", "active")
    .not("archive_at", "is", null)
    .lt("archive_at", now);

  if (error) throw error;
}

export async function getUnreadMessageCount(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<number> {
  const { data: threads, error: threadsError } = await client
    .from("message_threads")
    .select("id")
    .or(`buyer_wallet.eq.${wallet},seller_wallet.eq.${wallet}`);

  if (threadsError) throw threadsError;
  if (!threads?.length) return 0;

  const threadIds = threads.map((row) => row.id as string);
  const { count, error } = await client
    .from("direct_messages")
    .select("*", { count: "exact", head: true })
    .in("thread_id", threadIds)
    .eq("is_read", false)
    .neq("sender_wallet", wallet);

  if (error) throw error;
  return count ?? 0;
}

async function fetchParticipants(
  wallets: string[],
  client: SupabaseClient = supabase
): Promise<Map<string, ThreadParticipant>> {
  if (!wallets.length) return new Map();

  const { data, error } = await client
    .from("users")
    .select("wallet_address, username, avatar_url")
    .in("wallet_address", wallets);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [
      row.wallet_address as string,
      {
        wallet_address: row.wallet_address as string,
        username: (row.username as string | null) ?? null,
        avatar_url: (row.avatar_url as string | null) ?? null,
      },
    ])
  );
}

async function enrichThreadRows(
  threads: MessageThread[],
  wallet: string,
  client: SupabaseClient = supabase
): Promise<ThreadListItem[]> {
  if (!threads.length) return [];

  const threadIds = threads.map((thread) => thread.id);
  const auctionIds = [
    ...new Set(
      threads
        .map((thread) => thread.auction_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const partyWallets = [
    ...new Set(
      threads.flatMap((thread) => [thread.buyer_wallet, thread.seller_wallet])
    ),
  ];

  const [
    { data: messageRows, error: messagesError },
    { data: auctionRows, error: auctionsError },
    participants,
  ] = await Promise.all([
    client
      .from("direct_messages")
      .select("*")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
    auctionIds.length
      ? client.from("auctions").select("*").in("id", auctionIds)
      : Promise.resolve({ data: [], error: null }),
    fetchParticipants(partyWallets, client),
  ]);

  if (messagesError) throw messagesError;
  if (auctionsError) throw auctionsError;

  const auctionMap = new Map(
    (auctionRows ?? []).map((row) => [
      row.id as string,
      {
        id: row.id as string,
        title: row.title as string,
        image_url: (row.image_url as string | null) ?? null,
        status: row.status as Auction["status"],
      },
    ])
  );

  const lastMessageByThread = new Map<string, DirectMessage>();
  const unreadByThread = new Map<string, number>();

  for (const row of messageRows ?? []) {
    const message = parseDirectMessage(row as Record<string, unknown>);
    if (!lastMessageByThread.has(message.thread_id)) {
      lastMessageByThread.set(message.thread_id, message);
    }
    if (!message.is_read && message.sender_wallet !== wallet) {
      unreadByThread.set(
        message.thread_id,
        (unreadByThread.get(message.thread_id) ?? 0) + 1
      );
    }
  }

  return threads.map((thread) => {
    const otherWallet =
      thread.buyer_wallet === wallet
        ? thread.seller_wallet
        : thread.buyer_wallet;

    return {
      ...thread,
      auction: thread.auction_id
        ? auctionMap.get(thread.auction_id) ?? null
        : null,
      other_party: participants.get(otherWallet) ?? {
        wallet_address: otherWallet,
        username: null,
        avatar_url: null,
      },
      last_message: lastMessageByThread.get(thread.id) ?? null,
      unread_count: unreadByThread.get(thread.id) ?? 0,
    };
  });
}

export async function getThreadsForWallet(
  wallet: string,
  tab: MessagesTab,
  client: SupabaseClient = supabase
): Promise<ThreadListItem[]> {
  await checkAndArchiveThreads(client);

  let query = client.from("message_threads").select("*");

  if (tab === "buying") {
    query = query.eq("buyer_wallet", wallet).eq("status", "active");
  } else if (tab === "selling") {
    query = query.eq("seller_wallet", wallet).eq("status", "active");
  } else {
    query = query
      .eq("status", "archived")
      .or(`buyer_wallet.eq.${wallet},seller_wallet.eq.${wallet}`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const threads = (data ?? []).map((row) =>
    parseThread(row as Record<string, unknown>)
  );

  const enriched = await enrichThreadRows(threads, wallet, client);

  return enriched.sort((a, b) => {
    const aTime = a.last_message?.created_at ?? a.created_at;
    const bTime = b.last_message?.created_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function getThreadDetail(
  threadId: string,
  wallet: string,
  client: SupabaseClient = supabase
): Promise<ThreadDetail | null> {
  await checkAndArchiveThreads(client);

  const { data: threadRow, error: threadError } = await client
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) throw threadError;
  if (!threadRow) return null;

  const thread = parseThread(threadRow as Record<string, unknown>);
  if (thread.buyer_wallet !== wallet && thread.seller_wallet !== wallet) {
    return null;
  }

  const [{ data: messageRows, error: messagesError }, participants] =
    await Promise.all([
      client
        .from("direct_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
      fetchParticipants([thread.buyer_wallet, thread.seller_wallet], client),
    ]);

  if (messagesError) throw messagesError;

  let auction: Auction | null = null;
  let topBidderWallet: string | null = null;
  if (thread.auction_id) {
    const [{ data: auctionRow, error: auctionError }, { data: topBid, error: topBidError }] =
      await Promise.all([
        client
          .from("auctions")
          .select("*")
          .eq("id", thread.auction_id)
          .maybeSingle(),
        client
          .from("bids")
          .select("bidder_wallet")
          .eq("auction_id", thread.auction_id)
          .order("amount", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (auctionError) throw auctionError;
    if (topBidError) throw topBidError;

    auction = auctionRow
      ? parseAuctionRow(auctionRow as Record<string, unknown>)
      : null;
    topBidderWallet = (topBid?.bidder_wallet as string | undefined) ?? null;
  }

  const messages: EnrichedDirectMessage[] = (messageRows ?? []).map((row) => {
    const message = parseDirectMessage(row as Record<string, unknown>);
    const sender = participants.get(message.sender_wallet);
    return {
      ...message,
      sender_username: sender?.username ?? null,
      sender_avatar: sender?.avatar_url ?? null,
    };
  });

  return {
    ...thread,
    auction,
    top_bidder_wallet: topBidderWallet,
    buyer: participants.get(thread.buyer_wallet) ?? {
      wallet_address: thread.buyer_wallet,
      username: null,
      avatar_url: null,
    },
    seller: participants.get(thread.seller_wallet) ?? {
      wallet_address: thread.seller_wallet,
      username: null,
      avatar_url: null,
    },
    messages,
  };
}

export async function insertThreadSystemMessage(
  threadId: string,
  content: string,
  senderWallet: string,
  client: SupabaseClient = supabase
) {
  const { data: existing, error: existingError } = await client
    .from("direct_messages")
    .select("id")
    .eq("thread_id", threadId)
    .eq("content", content)
    .eq("is_system", true)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return;

  const { error } = await client.from("direct_messages").insert({
    thread_id: threadId,
    sender_wallet: senderWallet,
    content,
    is_system: true,
    is_read: false,
  });

  if (error) throw error;
}

export async function createAuctionThread(
  auctionId: string,
  buyerWallet: string,
  sellerWallet: string,
  itemTitle: string,
  options?: { skipWelcomeMessage?: boolean },
  client: SupabaseClient = supabase
): Promise<MessageThread> {
  await Promise.all([
    upsertUser(buyerWallet, client),
    upsertUser(sellerWallet, client),
  ]);

  const { data: existing, error: existingError } = await client
    .from("message_threads")
    .select("*")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", buyerWallet)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return parseThread(existing as Record<string, unknown>);

  const { data: thread, error } = await client
    .from("message_threads")
    .insert({
      auction_id: auctionId,
      buyer_wallet: buyerWallet,
      seller_wallet: sellerWallet,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;

  const parsed = parseThread(thread as Record<string, unknown>);
  if (!options?.skipWelcomeMessage) {
    await insertThreadSystemMessage(
      parsed.id,
      `🎉 Congratulations! You won ${itemTitle}. Use this thread to coordinate shipping and delivery with the seller.`,
      sellerWallet,
      client
    );
  }

  return parsed;
}

export async function createGeneralInquiryThread(
  buyerWallet: string,
  sellerWallet: string,
  client: SupabaseClient = supabase
): Promise<MessageThread> {
  await Promise.all([
    upsertUser(buyerWallet, client),
    upsertUser(sellerWallet, client),
  ]);

  const { data: existing, error: existingError } = await client
    .from("message_threads")
    .select("*")
    .eq("buyer_wallet", buyerWallet)
    .eq("seller_wallet", sellerWallet)
    .is("auction_id", null)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return parseThread(existing as Record<string, unknown>);

  const { data: thread, error } = await client
    .from("message_threads")
    .insert({
      auction_id: null,
      buyer_wallet: buyerWallet,
      seller_wallet: sellerWallet,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;

  const parsed = parseThread(thread as Record<string, unknown>);
  await insertThreadSystemMessage(
    parsed.id,
    "General inquiry started. Use this thread to ask questions before you bid.",
    sellerWallet,
    client
  );

  return parsed;
}

export async function getOrCreateAuctionThread(
  auctionId: string,
  buyerWallet: string,
  sellerWallet: string,
  itemTitle: string,
  client: SupabaseClient = supabase
): Promise<MessageThread> {
  return createAuctionThread(
    auctionId,
    buyerWallet,
    sellerWallet,
    itemTitle,
    undefined,
    client
  );
}

export async function sendDirectMessageRecord(
  threadId: string,
  senderWallet: string,
  content: string
): Promise<DirectMessage> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const { data: thread, error: threadError } = await supabase
    .from("message_threads")
    .select("status, buyer_wallet, seller_wallet")
    .eq("id", threadId)
    .single();

  if (threadError) {
    logSupabaseError("sendDirectMessageRecord: thread", threadError);
    throw new Error("Unable to send message. Please try again.");
  }
  if (thread.status === "archived") {
    throw new Error("This conversation has been archived.");
  }

  const wallet = senderWallet;
  if (
    thread.buyer_wallet !== wallet &&
    thread.seller_wallet !== wallet
  ) {
    throw new Error("You do not have access to this thread.");
  }

  await upsertUser(senderWallet);

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      thread_id: threadId,
      sender_wallet: senderWallet,
      content: trimmed,
      is_system: false,
      is_read: false,
    })
    .select("*")
    .single();

  if (error) {
    logSupabaseError("sendDirectMessageRecord: insert", error);
    throw new Error("Unable to send message. Please try again.");
  }

  const recipientWallet =
    thread.buyer_wallet === senderWallet
      ? thread.seller_wallet
      : thread.buyer_wallet;
  const senderDisplayName = await getUserDisplayName(senderWallet);

  await notifyNewMessage({
    recipientWallet: recipientWallet as string,
    senderDisplayName,
    preview: trimmed,
    threadId,
  });

  return parseDirectMessage(data as Record<string, unknown>);
}

/** Client helper — sends a message via the rate-limited API route. */
export async function sendDirectMessage(
  threadId: string,
  senderWallet: string,
  content: string
): Promise<DirectMessage> {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, senderWallet, content }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: DirectMessage;
  };

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload.error, "Unable to send message. Please try again.")
    );
  }

  if (!payload.message) {
    throw new Error("Unable to send message. Please try again.");
  }

  return payload.message;
}

export async function markThreadMessagesRead(
  threadId: string,
  wallet: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("direct_messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)
    .neq("sender_wallet", wallet)
    .eq("is_read", false);

  if (error) throw error;
}

/** Marks non-system messages from others as read across all user threads. */
export async function markAllThreadMessagesRead(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { data: threads, error: threadsError } = await client
    .from("message_threads")
    .select("id")
    .or(`buyer_wallet.eq.${wallet},seller_wallet.eq.${wallet}`);

  if (threadsError) throw threadsError;
  if (!threads?.length) return;

  const threadIds = threads.map((row) => row.id as string);
  const { error } = await client
    .from("direct_messages")
    .update({ is_read: true })
    .in("thread_id", threadIds)
    .neq("sender_wallet", wallet)
    .eq("is_system", false)
    .eq("is_read", false);

  if (error) throw error;
}

export interface ConfirmReceiptOnChainParams {
  provider: AnchorProvider;
  sellerWallet: string;
  platformWallet?: string;
}

export interface ConfirmReceiptResult {
  onChainSuccess?: boolean;
  onChainTxSignature?: string;
}

export async function confirmReceipt(
  threadId: string,
  buyerWallet: string,
  onChain?: ConfirmReceiptOnChainParams,
  client: SupabaseClient = supabase
): Promise<ConfirmReceiptResult> {
  const { data: existingThread, error: fetchError } = await client
    .from("message_threads")
    .select("id, auction_id, confirmed_at")
    .eq("id", threadId)
    .eq("buyer_wallet", buyerWallet)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existingThread) {
    throw new Error("Thread not found.");
  }
  if (existingThread.confirmed_at) {
    return { onChainSuccess: true };
  }

  const auctionId = (existingThread.auction_id as string | null) ?? null;
  let onChainTxSignature: string | undefined;

  if (auctionId) {
    if (!onChain) {
      throw new Error("Connect your wallet to confirm receipt on-chain.");
    }

    const onChainResult = await confirmReceiptOnChain(
      auctionId,
      onChain.provider.wallet,
      onChain.provider,
      onChain.sellerWallet,
      onChain.platformWallet
    );

    if (!onChainResult.success) {
      throw new Error(
        getErrorMessage(onChainResult.error, TX_FAILED_OR_CANCELLED_MESSAGE)
      );
    }

    onChainTxSignature = onChainResult.txSignature;
  }

  const archiveAt = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: thread, error: threadError } = await client
    .from("message_threads")
    .update({
      confirmed_at: new Date().toISOString(),
      archive_at: archiveAt,
    })
    .eq("id", threadId)
    .eq("buyer_wallet", buyerWallet)
    .is("confirmed_at", null)
    .select("*")
    .single();

  if (threadError) throw threadError;

  await insertThreadSystemMessage(
    threadId,
    "Buyer confirmed receipt. This thread will be archived in 3 days.",
    buyerWallet,
    client
  );

  if (auctionId) {
    const { error: auctionError } = await client
      .from("auctions")
      .update({
        status: "completed",
        shipping_status: "delivered",
        escrow_state: "complete",
      })
      .eq("id", auctionId)
      .neq("status", "completed");

    if (auctionError) throw auctionError;
  }

  return {
    onChainSuccess: Boolean(auctionId),
    onChainTxSignature,
  };
}

export function getThreadThumbnail(
  auction: Pick<Auction, "image_url" | "title" | "category"> | null
): string {
  if (!auction) {
    return "https://placehold.co/80x80/1a1a2e/7c3aed?text=?";
  }
  return resolveAuctionImageUrl(auction.image_url, {
    title: auction.title,
    category: auction.category ?? null,
  });
}
