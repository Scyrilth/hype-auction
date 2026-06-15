import { supabase } from "@/lib/supabase";

export interface BuyerStrikeRecord {
  id: string;
  wallet_address: string;
  auction_id: string | null;
  reason: string;
  created_at: string;
  expires_at: string | null;
}

export type BuyerStrikeStatus =
  | "none"
  | "warning"
  | "suspended"
  | "banned";

export interface BuyerStrikeSummary {
  status: BuyerStrikeStatus;
  activeStrikes: BuyerStrikeRecord[];
  strikeCount: number;
  suspensionExpiresAt: string | null;
  message: string | null;
}

function isStrikeActive(strike: BuyerStrikeRecord, now = Date.now()): boolean {
  if (strike.reason === "ban") return true;
  if (!strike.expires_at) return true;
  return new Date(strike.expires_at).getTime() > now;
}

export async function fetchActiveBuyerStrikes(
  walletAddress: string
): Promise<BuyerStrikeRecord[]> {
  const { data, error } = await supabase
    .from("buyer_strikes")
    .select("*")
    .eq("wallet_address", walletAddress)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as BuyerStrikeRecord[]).filter((strike) =>
    isStrikeActive(strike)
  );
}

export function summarizeBuyerStrikes(
  strikes: BuyerStrikeRecord[]
): BuyerStrikeSummary {
  const activeStrikes = strikes.filter((strike) => isStrikeActive(strike));

  if (!activeStrikes.length) {
    return {
      status: "none",
      activeStrikes: [],
      strikeCount: 0,
      suspensionExpiresAt: null,
      message: null,
    };
  }

  const hasBan = activeStrikes.some((strike) => strike.reason === "ban");
  if (hasBan) {
    return {
      status: "banned",
      activeStrikes,
      strikeCount: activeStrikes.length,
      suspensionExpiresAt: null,
      message: "Your account has been permanently banned from bidding.",
    };
  }

  const suspension = activeStrikes.find(
    (strike) =>
      strike.reason === "suspension_7d" || strike.reason === "cooldown_24h"
  );
  const hasSuspension = Boolean(suspension) || activeStrikes.length >= 2;

  if (hasSuspension) {
    const expiresAt = suspension?.expires_at ?? activeStrikes[0]?.expires_at ?? null;
    return {
      status: "suspended",
      activeStrikes,
      strikeCount: activeStrikes.length,
      suspensionExpiresAt: expiresAt,
      message: expiresAt
        ? `Your bidding is suspended until ${new Date(expiresAt).toLocaleDateString()}.`
        : "Your bidding is currently suspended.",
    };
  }

  return {
    status: "warning",
    activeStrikes,
    strikeCount: activeStrikes.length,
    suspensionExpiresAt: null,
    message: "You have a warning on your account.",
  };
}
