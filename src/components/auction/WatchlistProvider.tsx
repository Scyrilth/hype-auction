"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import {
  addToWatchlist,
  getWatchlistAuctionIds,
  removeFromWatchlist,
} from "@/lib/watchlist";
import { upsertUser } from "@/lib/users";

interface WatchlistContextValue {
  watchedIds: Set<string>;
  isLoading: boolean;
  isWatching: (auctionId: string) => boolean;
  toggleWatchlist: (auctionId: string) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const { showToast } = useToast();
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      setWatchedIds(new Set());
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const ids = await getWatchlistAuctionIds(publicKey!.toBase58());
        if (!cancelled) {
          setWatchedIds(new Set(ids));
        }
      } catch (error) {
        logSupabaseError("WatchlistProvider.load", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey]);

  const toggleWatchlist = useCallback(
    async (auctionId: string) => {
      if (!connected || !publicKey) return;

      const wallet = publicKey.toBase58();
      const isWatching = watchedIds.has(auctionId);

      try {
        await upsertUser(wallet);

        if (isWatching) {
          await removeFromWatchlist(wallet, auctionId);
          setWatchedIds((current) => {
            const next = new Set(current);
            next.delete(auctionId);
            return next;
          });
          showToast("Removed from watchlist");
        } else {
          await addToWatchlist(wallet, auctionId);
          setWatchedIds((current) => new Set(current).add(auctionId));
          showToast("Added to watchlist");
        }
      } catch (error) {
        logSupabaseError("WatchlistProvider.toggle", error);
        showToast(getErrorMessage(error), "error");
      }
    },
    [connected, publicKey, showToast, watchedIds]
  );

  const value = useMemo(
    () => ({
      watchedIds,
      isLoading,
      isWatching: (auctionId: string) => watchedIds.has(auctionId),
      toggleWatchlist,
    }),
    [watchedIds, isLoading, toggleWatchlist]
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}
