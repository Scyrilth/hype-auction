import { logSupabaseError } from "@/lib/errors";
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
