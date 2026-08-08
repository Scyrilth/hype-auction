import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAuthenticatedClient, supabase } from "@/lib/supabase";
import { getWalletAuthSession } from "@/lib/wallet-auth-client";

export function useSupabaseClient() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const session = getWalletAuthSession();
  const sessionToken =
    session && session.wallet === walletAddress ? session.token : null;

  const client = useMemo(() => {
    if (walletAddress) {
      return getAuthenticatedClient(
        walletAddress,
        sessionToken ? { "x-wallet-session-token": sessionToken } : {}
      );
    }
    return supabase;
  }, [walletAddress, sessionToken]);

  return { client, walletAddress };
}
