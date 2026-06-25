import type { Auction } from "@/lib/database.types";
import { issueBuyerStrike, type StrikeAction } from "@/lib/admin/actions";
import { createAuction } from "@/lib/seller";
import { formatSol } from "@/lib/format";
import {
  createAuctionThread,
  getAuctionThreadId,
} from "@/lib/messages";
import {
  createNotification,
  hasNotificationForAuction,
} from "@/lib/notifications";
import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase } from "@/lib/supabase";

export const PAYMENT_WINDOW_MS = [
  10 * 60 * 1000,
  2 * 60 * 60 * 1000,
  4 * 60 * 60 * 1000,
] as const;

export const NEXT_BIDDER_RESPONSE_MS = 2 * 60 * 60 * 1000;
export const NEXT_BIDDER_PAYMENT_MS = 2 * 60 * 60 * 1000;

export interface NextBidderOfferPayload {
  type: "next_bidder_offer";
  auction_id: string;
  bidder_wallet: string;
  amount_sol: number;
  response_deadline: string;
  payment_deadline: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  item_title: string;
}

export interface NextBidderRow {
  rank: number;
  wallet: string;
  username: string | null;
  amount: number;
  isNextInLine: boolean;
}

export interface UnpaidAuctionAction {
  auction: Auction;
  winnerWallet: string;
  nextBidders: NextBidderRow[];
}

function uniqueWallets(wallets: string[]): string[] {
  return [...new Set(wallets.filter(Boolean))];
}

export function getPaymentAttemptDeadline(
  endTime: string,
  attemptNumber: number
): Date {
  let timestamp = new Date(endTime).getTime();
  for (let index = 0; index < attemptNumber; index++) {
    timestamp += PAYMENT_WINDOW_MS[index] ?? 0;
  }
  return new Date(timestamp);
}

export function arePaymentAttemptsExhausted(auction: Auction): boolean {
  if (auction.payment_completed_at) return false;
  if (auction.escrow_attempt_number >= 3) return true;
  return Date.now() > getPaymentAttemptDeadline(auction.end_time, 3).getTime();
}

export function hasActiveNextBidderOffer(auction: Auction): boolean {
  if (!auction.next_bidder_wallet || !auction.next_bidder_response_deadline) {
    return false;
  }
  if (auction.payment_completed_at) return false;
  return new Date(auction.next_bidder_response_deadline).getTime() > Date.now();
}

export function needsSellerUnpaidAction(auction: Auction): boolean {
  if (auction.status !== "ended") return false;
  if (auction.relisted_auction_id) return false;
  if (auction.payment_completed_at) return false;
  if (hasActiveNextBidderOffer(auction)) return false;
  return arePaymentAttemptsExhausted(auction);
}

export function isNextBidderOfferContent(content: unknown): boolean {
  if (typeof content === "object" && content !== null && !Array.isArray(content)) {
    return (content as { type?: string }).type === "next_bidder_offer";
  }
  if (typeof content === "string") {
    return content.includes('"type":"next_bidder_offer"');
  }
  return false;
}

export function parseNextBidderOfferMessage(
  content: unknown
): NextBidderOfferPayload | null {
  if (!isNextBidderOfferContent(content)) return null;

  let value: Record<string, unknown>;
  if (typeof content === "string") {
    try {
      value = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof content === "object" && content !== null) {
    value = content as Record<string, unknown>;
  } else {
    return null;
  }

  if (value.type !== "next_bidder_offer") return null;
  if (typeof value.auction_id !== "string") return null;
  if (typeof value.bidder_wallet !== "string") return null;

  return {
    type: "next_bidder_offer",
    auction_id: value.auction_id,
    bidder_wallet: value.bidder_wallet,
    amount_sol: Number(value.amount_sol ?? 0),
    response_deadline: String(value.response_deadline ?? ""),
    payment_deadline:
      typeof value.payment_deadline === "string" ? value.payment_deadline : null,
    status:
      value.status === "accepted" ||
      value.status === "declined" ||
      value.status === "expired"
        ? value.status
        : "pending",
    item_title: typeof value.item_title === "string" ? value.item_title : "Item",
  };
}

async function getTopBidderWallet(auctionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.bidder_wallet as string | undefined) ?? null;
}

async function getBidAmount(
  auctionId: string,
  wallet: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("bids")
    .select("amount")
    .eq("auction_id", auctionId)
    .eq("bidder_wallet", wallet)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.amount != null ? Number(data.amount) : null;
}

export async function fetchNextHighestBidders(
  auctionId: string,
  excludeWallets: string[]
): Promise<NextBidderRow[]> {
  const excluded = new Set(excludeWallets.map((wallet) => wallet.toLowerCase()));

  const { data, error } = await supabase
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false });

  if (error) throw error;

  const bestByWallet = new Map<string, number>();
  for (const row of data ?? []) {
    const wallet = row.bidder_wallet as string;
    const amount = Number(row.amount);
    if (!wallet || excluded.has(wallet.toLowerCase())) continue;
    const existing = bestByWallet.get(wallet);
    if (existing == null || amount > existing) {
      bestByWallet.set(wallet, amount);
    }
  }

  const ranked = [...bestByWallet.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!ranked.length) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("wallet_address, username")
    .in(
      "wallet_address",
      ranked.map(([wallet]) => wallet)
    );

  if (usersError) throw usersError;

  const usernames = new Map(
    (users ?? []).map((row) => [
      row.wallet_address as string,
      (row.username as string | null) ?? null,
    ])
  );

  return ranked.map(([wallet, amount], index) => ({
    rank: index + 1,
    wallet,
    username: usernames.get(wallet) ?? null,
    amount,
    isNextInLine: index === 0,
  }));
}

async function countNonPaymentStrikes(wallet: string): Promise<number> {
  const { count, error } = await supabase
    .from("buyer_strikes")
    .select("id", { count: "exact", head: true })
    .eq("wallet_address", wallet)
    .in("reason", ["warning", "cooldown_24h", "suspension_7d", "non_payment"]);

  if (error) throw error;
  return count ?? 0;
}

async function issueProgressiveNonPaymentStrike(
  wallet: string,
  auctionId: string
): Promise<void> {
  const existing = await countNonPaymentStrikes(wallet);
  let action: StrikeAction = "warning";
  if (existing >= 2) action = "ban";
  else if (existing === 1) action = "suspension_7d";
  else action = "cooldown_24h";

  await issueBuyerStrike(wallet, action, auctionId);
}

async function appendExcludedWallet(
  auctionId: string,
  wallet: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("auctions")
    .select("payment_excluded_wallets")
    .eq("id", auctionId)
    .single();

  if (error) throw error;

  const current = Array.isArray(data.payment_excluded_wallets)
    ? (data.payment_excluded_wallets as string[])
    : [];
  const next = uniqueWallets([...current, wallet]);

  const { error: updateError } = await supabase
    .from("auctions")
    .update({ payment_excluded_wallets: next })
    .eq("id", auctionId);

  if (updateError) throw updateError;
  return next;
}

async function notifySellerActionRequired(auction: Auction): Promise<void> {
  const link = `/dashboard?unpaid=${auction.id}`;
  const alreadySent = await hasNotificationForAuction(
    auction.seller_wallet,
    "action_required_unpaid",
    link
  );
  if (alreadySent) return;

  await createNotification(
    auction.seller_wallet,
    "action_required_unpaid",
    "Winner didn't pay — action required",
    `The winner of ${auction.title} failed to complete payment. Offer the item to the next highest bidder or relist it.`,
    link
  );
}

export async function syncUnpaidAuctionState(auction: Auction): Promise<Auction> {
  if (!needsSellerUnpaidAction(auction) && !arePaymentAttemptsExhausted(auction)) {
    return auction;
  }

  if (auction.payment_completed_at || auction.relisted_auction_id) {
    return auction;
  }

  const exhausted = arePaymentAttemptsExhausted(auction);
  if (!exhausted) return auction;

  const updates: Record<string, unknown> = {};
  if (auction.escrow_attempt_number < 3) {
    updates.escrow_attempt_number = 3;
  }

  let synced = auction;
  if (Object.keys(updates).length) {
    const { data, error } = await supabase
      .from("auctions")
      .update(updates)
      .eq("id", auction.id)
      .select("*")
      .single();

    if (error) throw error;
    synced = parseAuctionRow(data as Record<string, unknown>);
  }

  if (needsSellerUnpaidAction(synced) && auction.escrow_attempt_number < 3) {
    const winnerWallet = await getTopBidderWallet(auction.id);
    if (winnerWallet) {
      await issueProgressiveNonPaymentStrike(winnerWallet, auction.id);
      await appendExcludedWallet(auction.id, winnerWallet);
      await notifySellerActionRequired(synced);
    }
  }

  return synced;
}

export async function fetchUnpaidAuctionActions(
  sellerWallet: string
): Promise<UnpaidAuctionAction[]> {
  const wallet = sellerWallet.trim();

  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("seller_wallet", wallet)
    .eq("status", "ended")
    .is("payment_completed_at", null)
    .is("relisted_auction_id", null)
    .gte("escrow_attempt_number", 3);

  if (error) throw error;

  console.log("[fetchUnpaidAuctionActions] query params:", {
    seller_wallet: wallet,
    status: "ended",
    payment_completed_at: null,
    escrow_attempt_number_gte: 3,
  });
  console.log(
    "[fetchUnpaidAuctionActions] raw rows:",
    (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      escrow_state: row.escrow_state,
      escrow_attempt_number: row.escrow_attempt_number,
      payment_completed_at: row.payment_completed_at,
      seller_wallet: row.seller_wallet,
    }))
  );

  const actions: UnpaidAuctionAction[] = [];

  for (const row of data ?? []) {
    let auction = parseAuctionRow(row as Record<string, unknown>);
    auction = await syncUnpaidAuctionState(auction);
    if (!needsSellerUnpaidAction(auction)) {
      console.log("[fetchUnpaidAuctionActions] skipped after filter:", {
        id: auction.id,
        title: auction.title,
        escrow_attempt_number: auction.escrow_attempt_number,
        payment_completed_at: auction.payment_completed_at,
        next_bidder_wallet: auction.next_bidder_wallet,
        relisted_auction_id: auction.relisted_auction_id,
      });
      continue;
    }

    const winnerWallet = (await getTopBidderWallet(auction.id)) ?? "";
    const excluded = uniqueWallets([
      winnerWallet,
      ...(auction.payment_excluded_wallets ?? []),
      ...(auction.next_bidder_wallet ? [auction.next_bidder_wallet] : []),
    ]);

    const nextBidders = await fetchNextHighestBidders(auction.id, excluded);

    actions.push({
      auction,
      winnerWallet,
      nextBidders,
    });
  }

  console.log(
    "[fetchUnpaidAuctionActions] actions returned:",
    actions.map((action) => ({
      id: action.auction.id,
      title: action.auction.title,
      nextBidderCount: action.nextBidders.length,
    }))
  );

  return actions;
}

async function insertOfferSystemMessage(
  threadId: string,
  payload: NextBidderOfferPayload,
  sellerWallet: string
): Promise<void> {
  const { error } = await supabase.from("direct_messages").insert({
    thread_id: threadId,
    sender_wallet: sellerWallet,
    content: JSON.stringify(payload),
    is_system: true,
    is_read: false,
  });

  if (error) throw error;
}

export async function offerToNextBidder({
  auctionId,
  sellerWallet,
  bidderWallet,
}: {
  auctionId: string;
  sellerWallet: string;
  bidderWallet: string;
}): Promise<void> {
  const { data: row, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .eq("seller_wallet", sellerWallet)
    .single();

  if (error) throw error;

  const auction = parseAuctionRow(row as Record<string, unknown>);
  if (!needsSellerUnpaidAction(auction)) {
    throw new Error("This auction does not need seller action right now.");
  }

  const bidAmount = await getBidAmount(auctionId, bidderWallet);
  if (bidAmount == null) {
    throw new Error("Selected bidder has no bid on this auction.");
  }

  const responseDeadline = new Date(Date.now() + NEXT_BIDDER_RESPONSE_MS);
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("auctions")
    .update({
      next_bidder_wallet: bidderWallet,
      next_bidder_offered_at: nowIso,
      next_bidder_response_deadline: responseDeadline.toISOString(),
      escrow_attempt_number: 1,
      escrow_state: "pending",
    })
    .eq("id", auctionId);

  if (updateError) throw updateError;

  const thread = await createAuctionThread(
    auctionId,
    bidderWallet,
    sellerWallet,
    auction.title,
    { skipWelcomeMessage: true }
  );

  const offerPayload: NextBidderOfferPayload = {
    type: "next_bidder_offer",
    auction_id: auctionId,
    bidder_wallet: bidderWallet,
    amount_sol: bidAmount,
    response_deadline: responseDeadline.toISOString(),
    payment_deadline: null,
    status: "pending",
    item_title: auction.title,
  };

  await insertOfferSystemMessage(thread.id, offerPayload, sellerWallet);

  await createNotification(
    bidderWallet,
    "next_bidder_offer",
    "You've been offered an auction win",
    `The winner of ${auction.title} didn't complete payment. As the next highest bidder, you've been offered this item for ${formatSol(bidAmount)}. You have 2 hours to accept or decline.`,
    `/messages/${thread.id}`
  );
}

export async function acceptNextBidderOffer({
  auctionId,
  bidderWallet,
  threadId,
}: {
  auctionId: string;
  bidderWallet: string;
  threadId: string;
}): Promise<void> {
  const { data: row, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .single();

  if (error) throw error;
  const auction = parseAuctionRow(row as Record<string, unknown>);

  if (auction.next_bidder_wallet !== bidderWallet) {
    throw new Error("This offer is not assigned to your wallet.");
  }

  const paymentDeadline = new Date(Date.now() + NEXT_BIDDER_PAYMENT_MS);

  const { error: updateError } = await supabase
    .from("auctions")
    .update({
      next_bidder_response_deadline: paymentDeadline.toISOString(),
      escrow_attempt_number: 1,
      escrow_state: "pending",
    })
    .eq("id", auctionId);

  if (updateError) throw updateError;

  const bidAmount = (await getBidAmount(auctionId, bidderWallet)) ?? 0;

  const offerPayload: NextBidderOfferPayload = {
    type: "next_bidder_offer",
    auction_id: auctionId,
    bidder_wallet: bidderWallet,
    amount_sol: bidAmount,
    response_deadline: auction.next_bidder_response_deadline ?? paymentDeadline.toISOString(),
    payment_deadline: paymentDeadline.toISOString(),
    status: "accepted",
    item_title: auction.title,
  };

  await insertOfferSystemMessage(threadId, offerPayload, auction.seller_wallet);

  await supabase.from("direct_messages").insert({
    thread_id: threadId,
    sender_wallet: bidderWallet,
    content:
      "✅ Offer accepted. Please complete payment within 2 hours using Pay Now below.",
    is_system: true,
    is_read: false,
  });
}

export async function declineNextBidderOffer({
  auctionId,
  bidderWallet,
  threadId,
}: {
  auctionId: string;
  bidderWallet: string;
  threadId: string;
}): Promise<void> {
  const { data: row, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .single();

  if (error) throw error;
  const auction = parseAuctionRow(row as Record<string, unknown>);

  if (auction.next_bidder_wallet !== bidderWallet) {
    throw new Error("This offer is not assigned to your wallet.");
  }

  await appendExcludedWallet(auctionId, bidderWallet);

  const { error: updateError } = await supabase
    .from("auctions")
    .update({
      next_bidder_wallet: null,
      next_bidder_offered_at: null,
      next_bidder_response_deadline: null,
      escrow_state: "none",
    })
    .eq("id", auctionId);

  if (updateError) throw updateError;

  const bidAmount = (await getBidAmount(auctionId, bidderWallet)) ?? 0;

  await insertOfferSystemMessage(
    threadId,
    {
      type: "next_bidder_offer",
      auction_id: auctionId,
      bidder_wallet: bidderWallet,
      amount_sol: bidAmount,
      response_deadline: auction.next_bidder_response_deadline ?? new Date().toISOString(),
      payment_deadline: null,
      status: "declined",
      item_title: auction.title,
    },
    auction.seller_wallet
  );

  await createNotification(
    auction.seller_wallet,
    "winner_declined",
    "Next bidder declined",
    "The next highest bidder declined your offer. Choose your next action on the dashboard.",
    "/dashboard"
  );
}

export function calculateSuggestedRelistPrice(
  bids: { bidder_wallet: string; amount: number }[],
  excludeWallets: string[]
): number {
  const excluded = new Set(excludeWallets.map((wallet) => wallet.toLowerCase()));
  const amounts = bids
    .filter((bid) => !excluded.has(bid.bidder_wallet.toLowerCase()))
    .map((bid) => bid.amount)
    .sort((a, b) => b - a)
    .slice(0, 5);

  if (!amounts.length) return 0;
  const sum = amounts.reduce((total, amount) => total + amount, 0);
  return Math.round((sum / amounts.length) * 100) / 100;
}

export async function publishRelist({
  sourceAuctionId,
  sellerWallet,
  startPrice,
  durationHours,
}: {
  sourceAuctionId: string;
  sellerWallet: string;
  startPrice: number;
  durationHours: number;
}): Promise<string> {
  const { data: sourceRow, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", sourceAuctionId)
    .eq("seller_wallet", sellerWallet)
    .single();

  if (error) throw error;
  const source = parseAuctionRow(sourceRow as Record<string, unknown>);

  const newAuction = await createAuction({
    sellerWallet,
    title: source.title,
    description: source.description ?? "",
    category: source.category ?? "Other",
    condition: source.condition ?? "Good",
    startPrice,
    durationHours,
    imageUrl: source.image_url ?? undefined,
    additionalImages: source.additional_images,
    itemDetails: source.item_details,
    domesticShippingUsd: source.domestic_shipping_usd,
    internationalShippingUsd: source.international_shipping_usd,
  });

  const { error: updateError } = await supabase
    .from("auctions")
    .update({ relisted_auction_id: newAuction.id })
    .eq("id", sourceAuctionId);

  if (updateError) throw updateError;

  const { data: bidderRows, error: biddersError } = await supabase
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", sourceAuctionId);

  if (biddersError) throw biddersError;

  const bidders = uniqueWallets(
    (bidderRows ?? []).map((row) => row.bidder_wallet as string)
  );

  const link = `/auction/${newAuction.id}`;
  await Promise.all(
    bidders.map((bidder) =>
      createNotification(
        bidder,
        "item_relisted",
        "An item you bid on has been relisted",
        `${source.title} has been relisted. Bid again before it ends!`,
        link
      )
    )
  );

  return newAuction.id;
}

async function wasNextBidderOfferAccepted(
  threadId: string,
  bidderWallet: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("content")
    .eq("thread_id", threadId)
    .eq("is_system", true);

  if (error) throw error;

  for (const row of data ?? []) {
    const offer = parseNextBidderOfferMessage(row.content);
    if (
      offer &&
      offer.bidder_wallet === bidderWallet &&
      offer.status === "accepted"
    ) {
      return true;
    }
  }

  return false;
}

export async function syncExpiredNextBidderOffers(): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .not("next_bidder_wallet", "is", null)
    .lt("next_bidder_response_deadline", nowIso)
    .is("payment_completed_at", null)
    .in("escrow_state", ["none", "pending"]);

  if (error) throw error;

  for (const row of data ?? []) {
    const auction = parseAuctionRow(row as Record<string, unknown>);
    const wallet = auction.next_bidder_wallet;
    if (!wallet) continue;

    const threadId = await getAuctionThreadId(auction.id, wallet);
    const accepted = threadId
      ? await wasNextBidderOfferAccepted(threadId, wallet)
      : false;

    if (accepted) {
      await issueProgressiveNonPaymentStrike(wallet, auction.id);
      await appendExcludedWallet(auction.id, wallet);
    } else {
      await appendExcludedWallet(auction.id, wallet);
    }

    await supabase
      .from("auctions")
      .update({
        next_bidder_wallet: null,
        next_bidder_offered_at: null,
        next_bidder_response_deadline: null,
        escrow_state: "none",
        escrow_attempt_number: 3,
      })
      .eq("id", auction.id);

    if (threadId) {
      const bidAmount = (await getBidAmount(auction.id, wallet)) ?? 0;
      await insertOfferSystemMessage(
        threadId,
        {
          type: "next_bidder_offer",
          auction_id: auction.id,
          bidder_wallet: wallet,
          amount_sol: bidAmount,
          response_deadline: auction.next_bidder_response_deadline ?? nowIso,
          payment_deadline: accepted
            ? auction.next_bidder_response_deadline
            : null,
          status: "expired",
          item_title: auction.title,
        },
        auction.seller_wallet
      );
    }

    await createNotification(
      auction.seller_wallet,
      accepted ? "action_required_unpaid" : "winner_declined",
      accepted ? "Offered bidder didn't pay" : "Next bidder did not respond",
      accepted
        ? `The offered bidder did not pay for ${auction.title}. Choose your next action on the dashboard.`
        : `The next highest bidder did not respond for ${auction.title}. Choose your next action on the dashboard.`,
      `/dashboard?unpaid=${auction.id}`
    );
  }
}

export async function getRelistSuggestion(
  auctionId: string,
  excludeWallets: string[]
): Promise<number> {
  const { data, error } = await supabase
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false });

  if (error) throw error;

  return calculateSuggestedRelistPrice(
    (data ?? []).map((row) => ({
      bidder_wallet: row.bidder_wallet as string,
      amount: Number(row.amount),
    })),
    excludeWallets
  );
}
