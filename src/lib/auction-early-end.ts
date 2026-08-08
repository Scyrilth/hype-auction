import { finalizeAuctionWinnerFlow } from "@/lib/auction-lifecycle";
import { parseAuctionRow } from "@/lib/parse-auction";
import {
  notifyEarlyEndSeller,
  notifyEarlyEndWinner,
} from "@/lib/notifications";
import { getNotificationClient, supabase, type SupabaseClient } from "@/lib/supabase";

export const EARLY_END_REASONS = [
  "Item sold elsewhere",
  "Item damaged or lost",
  "Listed by mistake",
  "Pricing error",
  "Other",
] as const;

export type EarlyEndReason = (typeof EARLY_END_REASONS)[number];

export type EarlyEndActor = "seller" | "admin";

const POST_PAYMENT_ESCROW_STATES = new Set(["funded", "shipped", "complete"]);

export function shouldHideEndAuctionButton(
  escrowState: string | null | undefined
): boolean {
  return POST_PAYMENT_ESCROW_STATES.has((escrowState ?? "").trim().toLowerCase());
}

async function getHighestBid(
  auctionId: string,
  client: SupabaseClient
): Promise<{ bidder_wallet: string; amount: number } | null> {
  const { data, error } = await client
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.bidder_wallet) return null;

  return {
    bidder_wallet: data.bidder_wallet as string,
    amount: Number(data.amount),
  };
}

async function getBidCount(auctionId: string, client: SupabaseClient): Promise<number> {
  const { count, error } = await client
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("auction_id", auctionId);

  if (error) throw error;
  return count ?? 0;
}

export async function endAuctionEarlyWithBids({
  auctionId,
  actorWallet,
  endedBy,
  reason,
  client = supabase,
}: {
  auctionId: string;
  actorWallet: string;
  endedBy: EarlyEndActor;
  reason: EarlyEndReason;
  client?: SupabaseClient;
}): Promise<void> {
  const { data: existing, error: loadError } = await client
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!existing) throw new Error("Auction not found.");

  const auction = parseAuctionRow(existing as Record<string, unknown>);
  if (auction.status !== "live") {
    throw new Error("Only live auctions can be ended early.");
  }
  if (endedBy === "seller" && auction.seller_wallet !== actorWallet) {
    throw new Error("Only the seller can end this auction.");
  }
  if (shouldHideEndAuctionButton(auction.escrow_state)) {
    throw new Error("This auction can no longer be ended early.");
  }

  const winningBid = await getHighestBid(auctionId, client);
  if (!winningBid) {
    throw new Error("This auction has no bids.");
  }

  const nowIso = new Date().toISOString();
  const updateQuery = client
    .from("auctions")
    .update({
      status: "ended",
      end_time: nowIso,
      ended_early: true,
      early_end_reason: reason,
      early_end_at: nowIso,
      early_end_by: endedBy,
      winner_wallet: winningBid.bidder_wallet,
      current_bid: winningBid.amount,
    })
    .eq("id", auctionId)
    .eq("status", "live");

  if (endedBy === "seller") {
    updateQuery.eq("seller_wallet", actorWallet);
  }

  const { data: updated, error: updateError } = await updateQuery
    .select("*")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) throw new Error("Auction not found or already ended.");

  const updatedAuction = parseAuctionRow(updated as Record<string, unknown>);
  await finalizeAuctionWinnerFlow(auctionId, updatedAuction, client, {
    skipNotifications: true,
  });

  const { data: threadRow } = await client
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", winningBid.bidder_wallet)
    .maybeSingle();

  const threadId = (threadRow?.id as string | undefined) ?? null;

  await notifyEarlyEndWinner({
    winnerWallet: winningBid.bidder_wallet,
    auctionTitle: updatedAuction.title,
    amount: winningBid.amount,
    threadId,
    client: getNotificationClient(),
  });

  await notifyEarlyEndSeller({
    sellerWallet: updatedAuction.seller_wallet,
    auctionTitle: updatedAuction.title,
    threadId,
    client,
  });
}

export async function endAuctionEarlyNoBids({
  auctionId,
  actorWallet,
  endedBy,
  client = supabase,
}: {
  auctionId: string;
  actorWallet: string;
  endedBy: EarlyEndActor;
  client?: SupabaseClient;
}): Promise<void> {
  const { data: existing, error: loadError } = await client
    .from("auctions")
    .select("status, seller_wallet, escrow_state")
    .eq("id", auctionId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!existing) throw new Error("Auction not found.");
  if ((existing.status as string) !== "live") {
    throw new Error("Only live auctions can be ended early.");
  }
  if (endedBy === "seller" && (existing.seller_wallet as string) !== actorWallet) {
    throw new Error("Only the seller can end this auction.");
  }
  if (shouldHideEndAuctionButton(existing.escrow_state as string)) {
    throw new Error("This auction can no longer be ended early.");
  }

  const bidCount = await getBidCount(auctionId, client);
  if (bidCount > 0) {
    throw new Error("This auction has bids. Use the early-end flow with a reason.");
  }

  const nowIso = new Date().toISOString();
  const updateQuery = client
    .from("auctions")
    .update({
      status: "cancelled",
      end_time: nowIso,
      ended_early: true,
      early_end_reason: null,
      early_end_at: nowIso,
      early_end_by: endedBy,
      winner_wallet: null,
    })
    .eq("id", auctionId)
    .eq("status", "live");

  if (endedBy === "seller") {
    updateQuery.eq("seller_wallet", actorWallet);
  }

  const { data: updated, error: updateError } = await updateQuery
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) throw new Error("Auction not found or already ended.");
}

export async function endAuctionEarlyAsSeller({
  auctionId,
  sellerWallet,
  reason,
  client,
}: {
  auctionId: string;
  sellerWallet: string;
  reason?: EarlyEndReason | null;
  client?: SupabaseClient;
}): Promise<void> {
  const db = client ?? supabase;
  const bidCount = await getBidCount(auctionId, db);

  if (bidCount > 0) {
    if (!reason) {
      throw new Error("A reason is required to end an auction with bids.");
    }
    await endAuctionEarlyWithBids({
      auctionId,
      actorWallet: sellerWallet,
      endedBy: "seller",
      reason,
      client: db,
    });
    return;
  }

  await endAuctionEarlyNoBids({
    auctionId,
    actorWallet: sellerWallet,
    endedBy: "seller",
    client: db,
  });
}

export async function endAuctionEarlyAsAdmin({
  auctionId,
  reason,
}: {
  auctionId: string;
  reason?: EarlyEndReason | null;
}): Promise<void> {
  const db = getNotificationClient();
  const { data: existing, error } = await db
    .from("auctions")
    .select("seller_wallet")
    .eq("id", auctionId)
    .maybeSingle();

  if (error) throw error;
  if (!existing?.seller_wallet) throw new Error("Auction not found.");

  const bidCount = await getBidCount(auctionId, db);
  const sellerWallet = existing.seller_wallet as string;

  if (bidCount > 0) {
    await endAuctionEarlyWithBids({
      auctionId,
      actorWallet: sellerWallet,
      endedBy: "admin",
      reason: reason ?? "Other",
      client: db,
    });
    return;
  }

  await endAuctionEarlyNoBids({
    auctionId,
    actorWallet: sellerWallet,
    endedBy: "admin",
    client: db,
  });
}

export type EarlyEndedAuctionRow = {
  auctionId: string;
  itemTitle: string;
  sellerWallet: string;
  earlyEndReason: string;
  earlyEndAt: string;
  highestBidSol: number;
  buyerWallet: string;
};

export async function fetchEarlyEndedAuctions(
  showDummyData: boolean
): Promise<EarlyEndedAuctionRow[]> {
  const db = getNotificationClient();
  const { data, error } = await db
    .from("auctions")
    .select(
      "id, title, seller_wallet, early_end_reason, early_end_at, current_bid, winner_wallet, is_dummy, escrow_tx_signature"
    )
    .eq("ended_early", true)
    .not("early_end_reason", "is", null)
    .order("early_end_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []).filter((row) => {
    if (showDummyData) return true;
    return !row.is_dummy;
  });

  const missingWinnerIds = rows
    .filter((row) => !(row.winner_wallet as string | null)?.trim())
    .map((row) => row.id as string);

  const winnerByAuction = new Map<string, string>();
  if (missingWinnerIds.length) {
    const { data: bids, error: bidsError } = await db
      .from("bids")
      .select("auction_id, bidder_wallet, amount")
      .in("auction_id", missingWinnerIds)
      .order("amount", { ascending: false });

    if (bidsError) throw bidsError;

    for (const bid of bids ?? []) {
      const auctionId = bid.auction_id as string;
      if (!winnerByAuction.has(auctionId)) {
        winnerByAuction.set(auctionId, bid.bidder_wallet as string);
      }
    }
  }

  return rows.map((row) => {
    const winnerWallet =
      (row.winner_wallet as string | null)?.trim() ||
      winnerByAuction.get(row.id as string) ||
      "Unknown";

    return {
      auctionId: row.id as string,
      itemTitle: (row.title as string) ?? "Untitled",
      sellerWallet: row.seller_wallet as string,
      earlyEndReason: row.early_end_reason as string,
      earlyEndAt: row.early_end_at as string,
      highestBidSol: Number(row.current_bid ?? 0),
      buyerWallet: winnerWallet,
    };
  });
}
