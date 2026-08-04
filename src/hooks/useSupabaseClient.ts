import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAuthenticatedClient, supabase } from "@/lib/supabase";
import { getWalletAuthHeaders, getWalletAuthSession } from "@/lib/wallet-auth-client";

export function useSupabaseClient() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const sessionToken = getWalletAuthSession()?.token ?? null;

  const client = useMemo(() => {
    if (walletAddress) {
      return getAuthenticatedClient(walletAddress, getWalletAuthHeaders());
    }
    return supabase;
  }, [walletAddress, sessionToken]);

  return { client, walletAddress };
}
