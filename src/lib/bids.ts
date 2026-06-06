import { logSupabaseError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { upsertUser } from "@/lib/users";

/** Records a bid in Supabase only — no on-chain SOL transfer. */
export async function placeBid({
  auctionId,
  bidderWallet,
  amount,
}: {
  auctionId: string;
  bidderWallet: string;
  amount: number;
}) {
  console.log("[placeBid] starting", { auctionId, bidderWallet, amount });

  const { data: auction, error: auctionError } = await supabase
    .from("auctions")
    .select("current_bid, start_price")
    .eq("id", auctionId)
    .maybeSingle();

  if (auctionError) {
    logSupabaseError("placeBid: fetch auction", auctionError);
    throw auctionError;
  }

  console.log("[placeBid] auction fetched", auction);

  if (!auction) {
    const notFound = new Error("Auction not found.");
    console.error("[placeBid] auction not found", { auctionId });
    throw notFound;
  }

  const floor = Math.max(
    Number(auction.current_bid),
    Number(auction.start_price)
  );
  console.log("[placeBid] bid floor", { floor, amount });

  if (amount <= floor) {
    const tooLow = new Error("Bid must be higher than the current bid.");
    console.error("[placeBid] bid too low", { amount, floor });
    throw tooLow;
  }

  try {
    await upsertUser(bidderWallet);
    console.log("[placeBid] user upserted", { bidderWallet });
  } catch (userError) {
    logSupabaseError("placeBid: upsert user", userError);
    throw userError;
  }

  const { data: bidData, error: bidError } = await supabase
    .from("bids")
    .insert({
      auction_id: auctionId,
      bidder_wallet: bidderWallet,
      amount,
    })
    .select();

  if (bidError) {
    logSupabaseError("placeBid: insert bid", bidError);
    throw bidError;
  }

  console.log("[placeBid] bid inserted", bidData);

  const { data: auctionData, error: updateError } = await supabase
    .from("auctions")
    .update({ current_bid: amount })
    .eq("id", auctionId)
    .select();

  if (updateError) {
    logSupabaseError("placeBid: update auction current_bid", updateError);
    throw updateError;
  }

  console.log("[placeBid] auction updated", auctionData);
  console.log("[placeBid] success");
}
