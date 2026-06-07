import type { Auction } from "@/lib/database.types";
import {
  createAuctionThread,
  insertThreadSystemMessage,
} from "@/lib/messages";
import { notifyAuctionWon } from "@/lib/notifications";
import { parseAuctionRow } from "@/lib/parse-auction";
import { supabase } from "@/lib/supabase";

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
  winnerBidAmount: number
): Promise<void> {
  const thread = await createAuctionThread(
    auction.id,
    winnerWallet,
    auction.seller_wallet,
    auction.title,
    { skipWelcomeMessage: true }
  );

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

  await insertThreadSystemMessage(
    thread.id,
    JSON.stringify(summary),
    auction.seller_wallet
  );

  await notifyAuctionWon({
    winnerWallet,
    auctionTitle: auction.title,
    amount: winnerBidAmount,
    threadId: thread.id,
  });
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

  if (error) throw error;
  if (!data?.bidder_wallet) return null;

  return {
    bidder_wallet: data.bidder_wallet as string,
    amount: Number(data.amount),
  };
}

export async function checkAndEndExpiredAuctions(): Promise<number> {
  const now = new Date().toISOString();

  const { data: expiredRows, error: fetchError } = await supabase
    .from("auctions")
    .select("*")
    .eq("status", "live")
    .lt("end_time", now);

  if (fetchError) throw fetchError;
  if (!expiredRows?.length) return 0;

  let endedCount = 0;

  for (const row of expiredRows) {
    const { data: updated, error: updateError } = await supabase
      .from("auctions")
      .update({ status: "ended" })
      .eq("id", row.id as string)
      .eq("status", "live")
      .select("*")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) continue;

    endedCount += 1;
    const auction = parseAuctionRow(updated as Record<string, unknown>);
    const winningBid = await getWinningBid(auction.id);

    if (!winningBid) continue;

    const { error: bidUpdateError } = await supabase
      .from("auctions")
      .update({ current_bid: winningBid.amount })
      .eq("id", auction.id);

    if (bidUpdateError) throw bidUpdateError;

    await createWinnerThread(
      { ...auction, current_bid: winningBid.amount },
      winningBid.bidder_wallet,
      winningBid.amount
    );
  }

  return endedCount;
}
