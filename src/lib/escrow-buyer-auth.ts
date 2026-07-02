import { getNotificationClient } from "@/lib/supabase";

/** Server-side check that a wallet is the legitimate buyer for an auction. */
export async function isBuyerForAuction(
  auctionId: string,
  buyerWallet: string,
  threadId?: string | null
): Promise<boolean> {
  const db = getNotificationClient();
  const normalizedBuyer = buyerWallet.trim();
  const normalizedThreadId = threadId?.trim() ?? "";

  if (normalizedThreadId) {
    const { data: thread, error } = await db
      .from("message_threads")
      .select("id, buyer_wallet, auction_id")
      .eq("id", normalizedThreadId)
      .maybeSingle();

    if (!error && thread) {
      const threadAuctionId = (thread.auction_id as string | null)?.trim() ?? "";
      const threadBuyer = (thread.buyer_wallet as string).trim();
      if (threadAuctionId === auctionId && threadBuyer === normalizedBuyer) {
        return true;
      }
    }
  }

  const { data: buyerThreads, error: threadError } = await db
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("buyer_wallet", normalizedBuyer)
    .limit(1);

  if (threadError) throw threadError;
  if (buyerThreads && buyerThreads.length > 0) return true;

  const { data: auction, error: auctionError } = await db
    .from("auctions")
    .select("next_bidder_wallet, escrow_funded")
    .eq("id", auctionId)
    .maybeSingle();

  if (auctionError) throw auctionError;

  const nextBidderWallet = (auction?.next_bidder_wallet as string | undefined)?.trim();
  if (nextBidderWallet && nextBidderWallet === normalizedBuyer) {
    return true;
  }

  const { data: topBids, error: bidError } = await db
    .from("bids")
    .select("bidder_wallet")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1);

  if (bidError) throw bidError;

  const topBidderWallet = (topBids?.[0]?.bidder_wallet as string | undefined)?.trim();
  if (topBidderWallet && topBidderWallet === normalizedBuyer) {
    return true;
  }

  if (auction?.escrow_funded) {
    const { data: fundedRows, error: fundedError } = await db
      .from("escrow_transactions")
      .select("id")
      .eq("auction_id", auctionId)
      .eq("event_type", "funded")
      .eq("from_wallet", normalizedBuyer)
      .limit(1);

    if (fundedError) throw fundedError;
    if (fundedRows && fundedRows.length > 0) return true;

    const { data: buyerBids, error: anyBidError } = await db
      .from("bids")
      .select("id")
      .eq("auction_id", auctionId)
      .eq("bidder_wallet", normalizedBuyer)
      .limit(1);

    if (anyBidError) throw anyBidError;
    if (buyerBids && buyerBids.length > 0) return true;
  }

  return false;
}
