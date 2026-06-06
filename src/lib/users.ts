import { supabase } from "@/lib/supabase";

export async function upsertUser(walletAddress: string) {
  const { error } = await supabase.from("users").upsert(
    { wallet_address: walletAddress },
    { onConflict: "wallet_address", ignoreDuplicates: false }
  );

  if (error) {
    throw error;
  }
}
