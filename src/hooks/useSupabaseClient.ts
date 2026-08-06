import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAuthenticatedClient, supabase } from "@/lib/supabase";

export function useSupabaseClient() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const client = useMemo(() => {
    if (walletAddress) {
      return getAuthenticatedClient(walletAddress);
    }
    return supabase;
  }, [walletAddress]);

  return { client, walletAddress };
}
