import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@/lib/supabase";

export type StrikeAction =
  | "warning"
  | "cooldown_24h"
  | "suspension_7d"
  | "ban";

export async function issueBuyerStrike(
  wallet: string,
  reason: StrikeAction,
  auctionId?: string | null,
  client: SupabaseClient = supabase
): Promise<void> {
  const expiresAt = new Date();
  switch (reason) {
    case "cooldown_24h":
      expiresAt.setHours(expiresAt.getHours() + 24);
      break;
    case "suspension_7d":
      expiresAt.setDate(expiresAt.getDate() + 7);
      break;
    case "ban":
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
      break;
    default:
      expiresAt.setMonth(expiresAt.getMonth() + 6);
  }

  const { error } = await client.from("buyer_strikes").insert({
    wallet_address: wallet,
    auction_id: auctionId ?? null,
    reason,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;
}

export async function liftBuyerRestrictions(
  wallet: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("buyer_strikes")
    .delete()
    .eq("wallet_address", wallet);

  if (error) throw error;
}

export async function sendAdminNotification(
  wallet: string,
  title: string,
  body: string,
  link?: string | null,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client.from("notifications").insert({
    wallet_address: wallet,
    type: "new_message",
    title,
    body,
    link: link ?? null,
    is_read: false,
  });

  if (error) throw error;
}

export async function updateEscrowState(
  auctionId: string,
  escrowState: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("auctions")
    .update({ escrow_state: escrowState })
    .eq("id", auctionId);

  if (error) throw error;
}
