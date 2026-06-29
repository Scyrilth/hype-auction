import type { Auction } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import {
  createAuctionThread,
  insertThreadSystemMessage,
  type MessageThread,
} from "@/lib/messages";
import {
  getUserDisplayName,
  notifyAuctionWon,
  notifySellerAuctionEnded,
} from "@/lib/notifications";
import { parseAuctionRow } from "@/lib/parse-auction";
import { getAuthenticatedClient, supabase, type SupabaseClient } from "@/lib/supabase";

function getWinnerFlowClient(sellerWallet: string): SupabaseClient {
  return getAuthenticatedClient(sellerWallet);
}

export interface AuctionSummaryPayload {
  type: "auction_summary";
  title: string;
  image_url: string | null;
  winning_bid: number;
  reference_number: string | null;
  category: string | null;
  condition: string | null;
  item_details: Record<string, string>;
  grading_company?: string | null;
  grade?: string | null;
  grade_label?: string | null;
  auction_id: string;
}

function normalizeItemDetails(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const details: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim()) {
      details[key] = raw.trim();
    }
  }
  return details;
}

function coerceAuctionSummaryPayload(
  value: Record<string, unknown>
): AuctionSummaryPayload | null {
  if (value.type !== "auction_summary") return null;

  const auctionId = value.auction_id;
  if (typeof auctionId !== "string" || !auctionId) return null;

  const itemDetails = normalizeItemDetails(value.item_details);

  return {
    type: "auction_summary",
    title: typeof value.title === "string" ? value.title : "Auction",
    image_url:
      typeof value.image_url === "string" ? value.image_url : null,
    winning_bid: Number(value.winning_bid ?? 0),
    reference_number:
      typeof value.reference_number === "string"
        ? value.reference_number
        : null,
    category: typeof value.category === "string" ? value.category : null,
    condition: typeof value.condition === "string" ? value.condition : null,
    item_details: itemDetails,
    grading_company:
      typeof value.grading_company === "string"
        ? value.grading_company
        : itemDetails.grading_company ?? null,
    grade:
      typeof value.grade === "string" ? value.grade : itemDetails.grade ?? null,
    grade_label:
      typeof value.grade_label === "string"
        ? value.grade_label
        : itemDetails.grade_label ?? null,
    auction_id: auctionId,
  };
}

export function isAuctionSummaryContent(content: unknown): boolean {
  if (typeof content === "object" && content !== null && !Array.isArray(content)) {
    return (content as { type?: string }).type === "auction_summary";
  }

  if (typeof content === "string") {
    return (
      content.includes('"type":"auction_summary"') ||
      content.includes('"type": "auction_summary"')
    );
  }

  return false;
}

export function parseAuctionSummaryMessage(
  content: unknown
): AuctionSummaryPayload | null {
  if (!isAuctionSummaryContent(content)) return null;

  if (typeof content === "object" && content !== null && !Array.isArray(content)) {
    return coerceAuctionSummaryPayload(content as Record<string, unknown>);
  }

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;
      return coerceAuctionSummaryPayload(parsed);
    } catch {
      return null;
    }
  }

  return null;
}

export async function createWinnerThread(
  auction: Auction,
  winnerWallet: string,
  winnerBidAmount: number,
  client: SupabaseClient = getWinnerFlowClient(auction.seller_wallet)
): Promise<MessageThread> {
  console.error("[winner-flow] createWinnerThread: start", {
    auctionId: auction.id,
    winnerWallet,
    winnerBidAmount,
  });

  let thread: MessageThread;
  try {
    thread = await createAuctionThread(
      auction.id,
      winnerWallet,
      auction.seller_wallet,
      auction.title,
      { skipWelcomeMessage: true },
      client
    );
    console.error("[winner-flow] createWinnerThread: thread ready", {
      auctionId: auction.id,
      threadId: thread.id,
    });
  } catch (error) {
    console.error("[winner-flow] createWinnerThread: thread creation failed", {
      auctionId: auction.id,
      error,
    });
    throw error;
  }

  const itemDetails = auction.item_details ?? {};
  const summary: AuctionSummaryPayload = {
    type: "auction_summary",
    title: auction.title,
    image_url: auction.image_url,
    category: auction.category,
    condition: auction.condition,
    item_details: itemDetails,
    grading_company: itemDetails.grading_company ?? null,
    grade: itemDetails.grade ?? null,
    grade_label: itemDetails.grade_label ?? null,
    winning_bid: winnerBidAmount,
    reference_number: auction.reference_number,
    auction_id: auction.id,
  };

  try {
    await insertThreadSystemMessage(
      thread.id,
      JSON.stringify(summary),
      auction.seller_wallet,
      client
    );
    console.error("[winner-flow] createWinnerThread: summary message inserted", {
      auctionId: auction.id,
      threadId: thread.id,
    });
  } catch (error) {
    console.error("[winner-flow] createWinnerThread: summary message failed", {
      auctionId: auction.id,
      threadId: thread.id,
      error,
    });
    throw error;
  }

  try {
    await notifyAuctionWon(
      {
        winnerWallet,
        auctionTitle: auction.title,
        amount: winnerBidAmount,
        threadId: thread.id,
      },
      getAuthenticatedClient(winnerWallet)
    );
    console.error("[winner-flow] createWinnerThread: winner notification sent", {
      auctionId: auction.id,
      winnerWallet,
    });
  } catch (error) {
    console.error("[winner-flow] createWinnerThread: winner notification failed", {
      auctionId: auction.id,
      error,
    });
    throw error;
  }

  try {
    const winnerDisplayName = await getUserDisplayName(winnerWallet);
    await notifySellerAuctionEnded(
      {
        sellerWallet: auction.seller_wallet,
        auctionTitle: auction.title,
        winnerDisplayName,
        amount: winnerBidAmount,
        threadId: thread.id,
      },
      client
    );
    console.error("[winner-flow] createWinnerThread: seller notification sent", {
      auctionId: auction.id,
      sellerWallet: auction.seller_wallet,
    });
  } catch (error) {
    console.error("[winner-flow] createWinnerThread: seller notification failed", {
      auctionId: auction.id,
      error,
    });
    throw error;
  }

  return thread;
}

async function getWinningBid(auctionId: string): Promise<{
  bidder_wallet: string;
  amount: number;
} | null> {
  const { data, error } = await supabase
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[winner-flow] getWinningBid: query failed", {
      auctionId,
      error,
    });
    throw error;
  }
  if (!data?.bidder_wallet) {
    console.error("[winner-flow] getWinningBid: no bids", { auctionId });
    return null;
  }

  return {
    bidder_wallet: data.bidder_wallet as string,
    amount: Number(data.amount),
  };
}

/** Idempotent winner flow: thread, summary message, and notifications. */
export async function finalizeAuctionWinnerFlow(
  auctionId: string,
  preloadedAuction?: Auction,
  client?: SupabaseClient
): Promise<boolean> {
  console.error("[winner-flow] finalizeAuctionWinnerFlow: start", { auctionId });

  let auction = preloadedAuction;
  if (!auction) {
    const { data, error } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", auctionId)
      .maybeSingle();

    if (error) {
      console.error("[winner-flow] finalizeAuctionWinnerFlow: load failed", {
        auctionId,
        error,
      });
      throw error;
    }
    if (!data) {
      console.error("[winner-flow] finalizeAuctionWinnerFlow: not found", {
        auctionId,
      });
      return false;
    }
    auction = parseAuctionRow(data as Record<string, unknown>);
  }

  if (auction.status !== "ended" && auction.status !== "completed") {
    console.error("[winner-flow] finalizeAuctionWinnerFlow: not ended", {
      auctionId,
      status: auction.status,
    });
    return false;
  }

  const flowClient = client ?? getWinnerFlowClient(auction.seller_wallet);

  const winningBid = await getWinningBid(auctionId);
  if (!winningBid) {
    return false;
  }

  const { data: existingThread, error: threadLookupError } = await flowClient
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", winningBid.bidder_wallet)
    .maybeSingle();

  if (threadLookupError) {
    console.error(
      "[winner-flow] finalizeAuctionWinnerFlow: thread lookup failed",
      { auctionId, error: threadLookupError }
    );
    throw threadLookupError;
  }

  if (existingThread) {
    console.error("[winner-flow] finalizeAuctionWinnerFlow: already finalized", {
      auctionId,
      threadId: existingThread.id,
    });
    return true;
  }

  if (auction.current_bid !== winningBid.amount) {
    const { error: bidUpdateError } = await flowClient
      .from("auctions")
      .update({ current_bid: winningBid.amount })
      .eq("id", auctionId);

    if (bidUpdateError) {
      console.error(
        "[winner-flow] finalizeAuctionWinnerFlow: current_bid update failed",
        { auctionId, error: bidUpdateError }
      );
      throw bidUpdateError;
    }
  }

  await createWinnerThread(
    { ...auction, current_bid: winningBid.amount },
    winningBid.bidder_wallet,
    winningBid.amount,
    flowClient
  );

  console.error("[winner-flow] finalizeAuctionWinnerFlow: success", {
    auctionId,
  });
  return true;
}

/** Backfill winner flow for ended auctions that have bids but no message thread. */
export async function recoverUnfinalizedEndedAuctions(): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: endedAuctions, error } = await supabase
    .from("auctions")
    .select("id, seller_wallet")
    .eq("status", "ended")
    .gte("end_time", since);

  if (error) {
    console.error("[winner-flow] recoverUnfinalizedEndedAuctions: load failed", {
      error,
    });
    logSupabaseError("recoverUnfinalizedEndedAuctions", error);
    return 0;
  }
  if (!endedAuctions?.length) return 0;

  let recovered = 0;

  for (const row of endedAuctions) {
    const auctionId = row.id as string;
    const sellerWallet = row.seller_wallet as string;
    const flowClient = getWinnerFlowClient(sellerWallet);

    const { data: thread, error: threadError } = await flowClient
      .from("message_threads")
      .select("id")
      .eq("auction_id", auctionId)
      .limit(1)
      .maybeSingle();

    if (threadError) {
      console.error("[winner-flow] recoverUnfinalizedEndedAuctions: thread check failed", {
        auctionId,
        error: threadError,
      });
      continue;
    }
    if (thread) continue;

    const { count, error: bidCountError } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("auction_id", auctionId);

    if (bidCountError) {
      console.error("[winner-flow] recoverUnfinalizedEndedAuctions: bid count failed", {
        auctionId,
        error: bidCountError,
      });
      continue;
    }
    if (!count) continue;

    try {
      const finalized = await finalizeAuctionWinnerFlow(
        auctionId,
        undefined,
        flowClient
      );
      if (finalized) recovered += 1;
    } catch (recoveryError) {
      console.error("[winner-flow] recoverUnfinalizedEndedAuctions: finalize failed", {
        auctionId,
        error: recoveryError,
      });
      logSupabaseError("recoverUnfinalizedEndedAuctions:auction", recoveryError);
    }
  }

  console.error("[winner-flow] recoverUnfinalizedEndedAuctions: complete", {
    recovered,
  });
  return recovered;
}

export async function checkAndEndExpiredAuctions(): Promise<number> {
  const now = new Date().toISOString();

  const { data: expiredRows, error: fetchError } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "live")
    .lt("end_time", now);

  if (fetchError) {
    console.error("[winner-flow] checkAndEndExpiredAuctions: fetch failed", {
      error: fetchError,
    });
    logSupabaseError("checkAndEndExpiredAuctions", fetchError);
    return 0;
  }
  if (!expiredRows?.length) return 0;

  let endedCount = 0;

  for (const row of expiredRows) {
    const auctionId = row.id as string;

    try {
      const { data: updated, error: updateError } = await supabase
        .from("auctions")
        .update({ status: "ended" })
        .eq("id", auctionId)
        .eq("status", "live")
        .select("*")
        .maybeSingle();

      if (updateError) {
        console.error("[winner-flow] checkAndEndExpiredAuctions: update failed", {
          auctionId,
          error: updateError,
        });
        logSupabaseError("checkAndEndExpiredAuctions:update", updateError);
        continue;
      }
      if (!updated) continue;

      endedCount += 1;
      const auction = parseAuctionRow(updated as Record<string, unknown>);

      console.error("[winner-flow] checkAndEndExpiredAuctions: auction ended", {
        auctionId,
      });

      await finalizeAuctionWinnerFlow(
        auctionId,
        auction,
        getWinnerFlowClient(auction.seller_wallet)
      );
    } catch (error) {
      console.error("[winner-flow] checkAndEndExpiredAuctions: auction failed", {
        auctionId,
        error,
      });
      logSupabaseError("checkAndEndExpiredAuctions:auction", error);
    }
  }

  return endedCount;
}
