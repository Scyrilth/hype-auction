"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  getNotifications,
  getUnreadCount,
  type Notification,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

export function useNotifications() {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = publicKey?.toBase58();

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!mounted) return;

    if (!connected || !wallet) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [items, count] = await Promise.all([
        getNotifications(wallet),
        getUnreadCount(wallet),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      setError("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [connected, mounted, wallet]);

  useEffect(() => {
    if (!mounted) return;
    void refresh();
  }, [mounted, refresh]);

  useEffect(() => {
    if (!mounted || !wallet) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`notifications:${wallet}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `wallet_address=eq.${wallet}`,
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
            table: "notifications",
            filter: `wallet_address=eq.${wallet}`,
          },
          () => {
            void refresh();
          }
        )
        .subscribe();
    } catch {
      // Realtime is optional — page still works without it
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [mounted, wallet, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    mounted,
    refresh,
    isConnected: connected && Boolean(wallet),
  };
}
