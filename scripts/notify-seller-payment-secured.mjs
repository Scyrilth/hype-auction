/**
 * One-off: send seller "Payment secured" notification for an existing funded escrow.
 * Usage: node scripts/notify-seller-payment-secured.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const THREAD_ID = "90380e4c-1e5b-4fbf-9330-7dbc21e91f08";
const SELLER_WALLET = "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT";
const AMOUNT_SOL = 0.17;
const ITEM_TITLE = "2022 Star Birth Charizard V Holo #014 JPN";

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

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const link = `/messages/${THREAD_ID}`;
const title = "Payment secured! 💰";
const body = `Buyer paid ${formatSol(AMOUNT_SOL)} for ${ITEM_TITLE}. Ship the item and upload tracking to release your funds.`;

const { data: existing, error: existingError } = await supabase
  .from("notifications")
  .select("id")
  .eq("wallet_address", SELLER_WALLET)
  .eq("type", "payment_confirmed")
  .eq("link", link)
  .eq("title", title)
  .maybeSingle();

if (existingError) {
  console.error("Lookup failed:", existingError);
  process.exit(1);
}

if (existing) {
  console.log("Notification already exists:", existing.id);
  process.exit(0);
}

const { data, error } = await supabase
  .from("notifications")
  .insert({
    wallet_address: SELLER_WALLET,
    type: "payment_confirmed",
    title,
    body,
    link,
    is_read: false,
  })
  .select("id")
  .single();

if (error) {
  console.error("Insert failed:", error);
  process.exit(1);
}

const { error: threadError } = await supabase
  .from("message_threads")
  .update({ escrow_status: "funded" })
  .eq("id", THREAD_ID);

if (threadError) {
  console.warn("Thread escrow_status update failed:", threadError.message);
}

console.log("Seller notification created:", data.id);
