/**
 * One-off script to run the winner flow for an ended auction via Supabase.
 * Usage: node scripts/finalize-auction-winner.mjs [auctionId]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const DEFAULT_AUCTION_ID = "0d6df47b-7f0c-46fa-b37c-1ee67b3c0211";

function loadEnvLocal() {
  const content = readFileSync(resolve(".env.local"), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function formatSol(amount) {
  return `${Number(amount).toFixed(2)} SOL`;
}

function shortenAddress(wallet, chars = 4) {
  return `${wallet.slice(0, chars)}...${wallet.slice(-chars)}`;
}

loadEnvLocal();

const auctionId = process.argv[2]?.trim() || DEFAULT_AUCTION_ID;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getAuthenticatedClient(walletAddress) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-wallet-address": walletAddress,
      },
    },
  });
}

async function upsertUser(wallet, client) {
  const { error } = await client.from("users").upsert(
    { wallet_address: wallet },
    { onConflict: "wallet_address", ignoreDuplicates: true }
  );
  if (error) throw error;
}

async function getUserDisplayName(wallet) {
  const { data } = await supabase
    .from("users")
    .select("username")
    .eq("wallet_address", wallet)
    .maybeSingle();
  const username = data?.username?.trim();
  return username ? `@${username}` : shortenAddress(wallet);
}

async function hasNotification(wallet, type, link, client = supabase) {
  const { data } = await client
    .from("notifications")
    .select("id")
    .eq("wallet_address", wallet)
    .eq("type", type)
    .eq("link", link)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function finalizeAuctionWinnerFlow(id) {
  console.error("[winner-flow] finalize: start", { auctionId: id });

  const { data: auctionRow, error: auctionError } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (auctionError) throw auctionError;
  if (!auctionRow) {
    console.error("[winner-flow] auction not found");
    return false;
  }
  if (auctionRow.status !== "ended" && auctionRow.status !== "completed") {
    console.error("[winner-flow] auction not ended", auctionRow.status);
    return false;
  }

  const { data: winningBid, error: bidError } = await supabase
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (bidError) throw bidError;
  if (!winningBid?.bidder_wallet) {
    console.error("[winner-flow] no winning bid");
    return false;
  }

  const winnerWallet = winningBid.bidder_wallet;
  const winnerAmount = Number(winningBid.amount);
  const sellerWallet = auctionRow.seller_wallet;
  const flowClient = getAuthenticatedClient(sellerWallet);

  console.error("[winner-flow] using seller auth client", { sellerWallet });
  console.error("[winner-flow] winner resolved", {
    winnerWallet,
    winnerAmount,
  });

  const { data: existingThread } = await flowClient
    .from("message_threads")
    .select("id")
    .eq("auction_id", id)
    .eq("buyer_wallet", winnerWallet)
    .maybeSingle();

  let threadId = existingThread?.id;

  if (!threadId) {
    await Promise.all([
      upsertUser(winnerWallet, flowClient),
      upsertUser(sellerWallet, flowClient),
    ]);

    const { data: thread, error: threadError } = await flowClient
      .from("message_threads")
      .insert({
        auction_id: id,
        buyer_wallet: winnerWallet,
        seller_wallet: sellerWallet,
        status: "active",
      })
      .select("id")
      .single();

    if (threadError) throw threadError;
    threadId = thread.id;
    console.error("[winner-flow] thread created", { threadId });
  } else {
    console.error("[winner-flow] thread exists", { threadId });
  }

  const summary = JSON.stringify({
    type: "auction_summary",
    title: auctionRow.title,
    image_url: auctionRow.image_url,
    category: auctionRow.category,
    condition: auctionRow.condition,
    item_details: auctionRow.item_details ?? {},
    winning_bid: winnerAmount,
    reference_number: auctionRow.reference_number,
    auction_id: id,
  });

  const { data: existingMessage } = await flowClient
    .from("direct_messages")
    .select("id")
    .eq("thread_id", threadId)
    .eq("content", summary)
    .eq("is_system", true)
    .maybeSingle();

  if (!existingMessage) {
    const { error: messageError } = await flowClient.from("direct_messages").insert({
      thread_id: threadId,
      sender_wallet: sellerWallet,
      content: summary,
      is_system: true,
      is_read: false,
    });
    if (messageError) throw messageError;
    console.error("[winner-flow] summary message inserted");
  }

  const link = `/messages/${threadId}`;

  const winnerClient = getAuthenticatedClient(winnerWallet);

  if (!(await hasNotification(winnerWallet, "auction_won", link, winnerClient))) {
    const { error: winnerNotifyError } = await winnerClient
      .from("notifications")
      .insert({
        wallet_address: winnerWallet,
        type: "auction_won",
        title: "You won the auction!",
        body: `You won ${auctionRow.title} with a bid of ${formatSol(winnerAmount)}.`,
        link,
        is_read: false,
      });
    if (winnerNotifyError) throw winnerNotifyError;
    console.error("[winner-flow] winner notification sent");
  }

  const winnerDisplayName = await getUserDisplayName(winnerWallet);
  if (!(await hasNotification(sellerWallet, "auction_ended", link, flowClient))) {
    const { error: sellerNotifyError } = await flowClient
      .from("notifications")
      .insert({
        wallet_address: sellerWallet,
        type: "auction_ended",
        title: "Auction ended",
        body: `Your auction "${auctionRow.title}" ended. Winner: ${winnerDisplayName} (${formatSol(winnerAmount)}).`,
        link,
        is_read: false,
      });
    if (sellerNotifyError) throw sellerNotifyError;
    console.error("[winner-flow] seller notification sent");
  }

  if (Number(auctionRow.current_bid) !== winnerAmount) {
    const { error: updateError } = await flowClient
      .from("auctions")
      .update({ current_bid: winnerAmount })
      .eq("id", id);
    if (updateError) throw updateError;
  }

  console.error("[winner-flow] finalize: success", { threadId });
  return true;
}

try {
  const ok = await finalizeAuctionWinnerFlow(auctionId);
  console.log(ok ? "SUCCESS" : "SKIPPED");
} catch (error) {
  console.error("FAILED", error);
  process.exit(1);
}
