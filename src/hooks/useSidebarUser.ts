"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { supabase } from "@/lib/supabase";

export function useSidebarUser() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const [username, setUsername] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !wallet) {
      setUsername(null);
      setIsVendor(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("username, is_vendor")
          .eq("wallet_address", wallet)
          .maybeSingle();

        if (cancelled) return;
        setUsername((data?.username as string | null) ?? null);
        setIsVendor(Boolean(data?.is_vendor));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, wallet]);

  return { connected, wallet, username, isVendor, loading };
}
