"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

export function useSidebarUser() {
  const { publicKey, connected } = useWallet();
  const { client } = useSupabaseClient();
  const wallet = publicKey?.toBase58() ?? null;
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !wallet) {
      setUsername(null);
      setAvatarUrl(null);
      setIsVendor(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const { data } = await client
          .from("users")
          .select("username, avatar_url, is_vendor")
          .eq("wallet_address", wallet)
          .maybeSingle();

        if (cancelled) return;
        setUsername((data?.username as string | null) ?? null);
        setAvatarUrl((data?.avatar_url as string | null) ?? null);
        setIsVendor(Boolean(data?.is_vendor));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, connected, wallet]);

  return { connected, wallet, username, avatarUrl, isVendor, loading };
}
