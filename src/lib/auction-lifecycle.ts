import type { Auction } from "@/lib/database.types";
import {
  createAuctionThread,
  insertThreadSystemMessage,
} from "@/lib/messages";
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
  auction_id: string;
}

export function parseAuctionSummaryMessage(
  content: string
): AuctionSummaryPayload | null {
  if (!content.startsWith('{"type":"auction_summary"')) return null;

  try {
    const parsed = JSON.parse(content) as AuctionSummaryPayload;
    if (parsed?.type === "auction_summary") return parsed;
  } catch {
    return null;
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

  await insertThreadSystemMessage(
    thread.id,
    "🎉 Congratulations! You won this auction.",
    auction.seller_wallet
  );

  const summary: AuctionSummaryPayload = {
    type: "auction_summary",
    title: auction.title,
    image_url: auction.image_url,
    winning_bid: winnerBidAmount,
    reference_number: auction.reference_number,
    category: auction.category,
    condition: auction.condition,
    auction_id: auction.id,
  };

  await insertThreadSystemMessage(
    thread.id,
    JSON.stringify(summary),
    auction.seller_wallet
  );
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
