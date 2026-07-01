"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  getUnreadMessageCount,
  MESSAGES_UNREAD_CHANGE_EVENT,
} from "@/lib/messages";

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

  useEffect(() => {
    const handleUnreadChange = () => void refresh();
    window.addEventListener(MESSAGES_UNREAD_CHANGE_EVENT, handleUnreadChange);
    return () =>
      window.removeEventListener(MESSAGES_UNREAD_CHANGE_EVENT, handleUnreadChange);
  }, [refresh]);

  useEffect(() => {
    if (!connected || !publicKey) return;

    let channel: ReturnType<typeof client.channel> | null = null;

    try {
      channel = client
        .channel(`unread-messages:${publicKey.toBase58()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
          },
          () => {
            void refresh();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "direct_messages",
          },
          () => {
            void refresh();
          }
        )
        .subscribe();
    } catch {
      // Realtime is optional — polling and custom events still refresh the badge
    }

    return () => {
      if (channel) {
        client.removeChannel(channel);
      }
    };
  }, [client, connected, publicKey, refresh]);

  return { count, refresh };
}
