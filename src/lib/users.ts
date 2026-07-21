import { logSupabaseError } from "@/lib/errors";
import { CURRENT_TOS_VERSION } from "@/lib/legal/tos-version";
import { supabase, type SupabaseClient } from "@/lib/supabase";

export type OnboardingIntent = "buy" | "sell" | "both";

export async function getUserByWallet(
  walletAddress: string,
  client: SupabaseClient = supabase
) {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    logSupabaseError("getUserByWallet", error);
    throw error;
  }

  return data;
}

export function hasAcceptedTerms(user: {
  tos_accepted_at?: string | null;
} | null | undefined): boolean {
  return Boolean(user?.tos_accepted_at);
}

export function hasExistingUserProfile(user: {
  username?: string | null;
  avatar_url?: string | null;
  country?: string | null;
  shop_name?: string | null;
  bio?: string | null;
}): boolean {
  return Boolean(
    user.username?.trim() ||
      user.avatar_url?.trim() ||
      user.country?.trim() ||
      user.shop_name?.trim() ||
      user.bio?.trim()
  );
}

export async function acceptAgeAndTerms(
  walletAddress: string,
  client: SupabaseClient = supabase
) {
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("users")
    .upsert(
      {
        wallet_address: walletAddress,
        age_confirmed_at: now,
        tos_accepted_at: now,
        tos_version: CURRENT_TOS_VERSION,
      },
      { onConflict: "wallet_address", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    logSupabaseError("acceptAgeAndTerms", error);
    throw error;
  }

  return data;
}

export async function createUserRecord(
  walletAddress: string,
  intent: OnboardingIntent = "buy",
  client: SupabaseClient = supabase
) {
  const isVendor = intent === "sell" || intent === "both";

  const { data, error } = await client
    .from("users")
    .upsert(
      {
        wallet_address: walletAddress,
        is_vendor: isVendor,
      },
      { onConflict: "wallet_address", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    logSupabaseError("createUserRecord", error);
    throw error;
  }

  return data;
}

export async function upsertUser(
  walletAddress: string,
  client: SupabaseClient = supabase
) {
  console.log("[upsertUser] starting", { walletAddress });

  const { data, error } = await client
    .from("users")
    .upsert(
      { wallet_address: walletAddress },
      { onConflict: "wallet_address", ignoreDuplicates: true }
    )
    .select();

  if (error) {
    logSupabaseError("upsertUser", error);
    throw error;
  }

  console.log("[upsertUser] success", data);
}
