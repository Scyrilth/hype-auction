import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export function getAuthenticatedClient(walletAddress: string) {
  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    global: {
      headers: {
        "x-wallet-address": walletAddress,
      },
    },
  });
}
