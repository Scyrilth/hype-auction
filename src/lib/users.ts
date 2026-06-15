import { logSupabaseError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export type OnboardingIntent = "buy" | "sell" | "both";

export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase
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
  intent: OnboardingIntent = "buy"
) {
  const isVendor = intent === "sell" || intent === "both";

  const { data, error } = await supabase
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

export async function upsertUser(walletAddress: string) {
  console.log("[upsertUser] starting", { walletAddress });

  const { data, error } = await supabase
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
