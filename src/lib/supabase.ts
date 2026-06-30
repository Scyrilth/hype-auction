import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

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

let notificationClient: SupabaseClient | null = null;

/** Prefer service role on the server so lifecycle notifications can target any wallet. */
export function getNotificationClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    if (!notificationClient) {
      notificationClient = createClient(supabaseConfig.url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return notificationClient;
  }
  return supabase;
}

export function getAuthenticatedClient(walletAddress: string) {
  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    global: {
      headers: {
        "x-wallet-address": walletAddress,
      },
    },
  });
}
