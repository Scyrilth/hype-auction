import { logSupabaseError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export async function upsertUser(walletAddress: string) {
  console.log("[upsertUser] starting", { walletAddress });

  const { data, error } = await supabase
    .from("users")
    .upsert(
      { wallet_address: walletAddress },
      { onConflict: "wallet_address", ignoreDuplicates: false }
    )
    .select();

  if (error) {
    logSupabaseError("upsertUser", error);
    throw error;
  }

  console.log("[upsertUser] success", data);
}
