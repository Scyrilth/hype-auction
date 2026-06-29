"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  getNotifications,
  getUnreadCount,
  parseNotification,
  type Notification,
} from "@/lib/notifications";

type RefreshOptions = {
  silent?: boolean;
};

export function useNotifications() {
  const { publicKey, connected } = useWallet();
  const { client } = useSupabaseClient();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unreadCountRef = useRef(0);

  const wallet = publicKey?.toBase58();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const refresh = useCallback(
    async (options: RefreshOptions = {}) => {
      if (!mounted) return;

      if (!connected || !wallet) {
        setNotifications([]);
        setUnreadCount(0);
        unreadCountRef.current = 0;
        setError(null);
        setLoading(false);
        return;
      }

      if (!options.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const [items, count] = await Promise.all([
          getNotifications(wallet, client),
          getUnreadCount(wallet, client),
        ]);
        setNotifications(items);
        setUnreadCount(count);
        unreadCountRef.current = count;
      } catch {
        if (!options.silent) {
          setNotifications([]);
          setUnreadCount(0);
          unreadCountRef.current = 0;
          setError("Could not load notifications");
        }
      } finally {
        if (!options.silent) {
          setLoading(false);
        }
      }
    },
    [client, connected, mounted, wallet]
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!mounted || !connected || !wallet) return;

    try {
      const count = await getUnreadCount(wallet, client);
      const countChanged = unreadCountRef.current !== count;

      setUnreadCount(count);
      unreadCountRef.current = count;

      if (countChanged) {
        await refresh({ silent: true });
      }
    } catch {
      // Polling is best-effort
    }
  }, [client, connected, mounted, refresh, wallet]);

  const prependNotification = useCallback((row: Record<string, unknown>) => {
    try {
      const notification = parseNotification(row);

      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      if (!notification.is_read) {
        setUnreadCount((prev) => {
          const next = prev + 1;
          unreadCountRef.current = next;
          return next;
        });
      }
    } catch {
      void refresh({ silent: true });
    }
  }, [refresh]);

  useEffect(() => {
    if (!mounted) return;
    void refresh();
  }, [mounted, refresh]);

  useEffect(() => {
    if (!mounted || !wallet) return;

    // Ensure notifications table has Realtime enabled in Supabase Dashboard → Database → Replication
    let channel: ReturnType<typeof client.channel> | null = null;

    try {
      channel = client
        .channel(`notifications:${wallet}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `wallet_address=eq.${wallet}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new === "object") {
              prependNotification(payload.new as Record<string, unknown>);
            } else {
              void refresh({ silent: true });
            }
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
            void refresh({ silent: true });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void refresh({ silent: true });
          }
        });
    } catch {
      // Realtime is optional — polling fallback still runs
    }

    return () => {
      if (channel) {
        client.removeChannel(channel);
      }
    };
  }, [client, mounted, wallet, prependNotification, refresh]);

  useEffect(() => {
    if (!mounted || !wallet) return;

    const interval = setInterval(() => {
      void refreshUnreadCount();
    }, 10_000);

    return () => clearInterval(interval);
  }, [mounted, wallet, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    mounted,
    refresh,
    refreshUnreadCount,
    isConnected: connected && Boolean(wallet),
  };
}
