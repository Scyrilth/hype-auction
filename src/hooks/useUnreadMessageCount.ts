"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getUnreadMessageCount } from "@/lib/messages";

export function useUnreadMessageCount() {
  const { publicKey, connected } = useWallet();
  const { client } = useSupabaseClient();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!connected || !publicKey) {
      setCount(0);
      return;
    }

    try {
      const unread = await getUnreadMessageCount(publicKey.toBase58(), client);
      setCount(unread);
    } catch {
      setCount(0);
    }
  }, [client, connected, publicKey]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  return { count, refresh };
}
