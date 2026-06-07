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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const wallet = publicKey?.toBase58();

  const refresh = useCallback(async () => {
    if (!connected || !wallet) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [connected, wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!wallet) return;

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallet, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
  };
}
