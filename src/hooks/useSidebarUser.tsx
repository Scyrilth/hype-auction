"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

const VENDOR_CACHE_KEY = "hype-sidebar-vendor-cache";

type SidebarUserState = {
  connected: boolean;
  wallet: string | null;
  username: string | null;
  avatarUrl: string | null;
  isVendor: boolean;
  loading: boolean;
};

const SidebarUserContext = createContext<SidebarUserState | null>(null);

function readVendorCache(wallet: string): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(VENDOR_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Object.prototype.hasOwnProperty.call(parsed, wallet)
      ? Boolean(parsed[wallet])
      : null;
  } catch {
    return null;
  }
}

function writeVendorCache(wallet: string, isVendor: boolean): void {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(VENDOR_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    parsed[wallet] = isVendor;
    sessionStorage.setItem(VENDOR_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage failures.
  }
}

function useSidebarUserState(): SidebarUserState {
  const { publicKey, connected, connecting } = useWallet();
  const { client, walletAddress } = useSupabaseClient();
  const wallet = publicKey?.toBase58() ?? null;

  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !wallet || connecting) {
      if (!connected || !wallet) {
        setUsername(null);
        setAvatarUrl(null);
        setIsVendor(false);
        setLoading(false);
      }
      return;
    }

    const cachedVendor = readVendorCache(wallet);
    if (cachedVendor !== null) {
      setIsVendor(cachedVendor);
    }

    if (!walletAddress || walletAddress !== wallet) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const { data, error } = await client
          .from("users")
          .select("username, avatar_url, is_vendor")
          .eq("wallet_address", wallet)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("[useSidebarUser] failed to load user profile:", error);
          return;
        }

        const vendor = Boolean(data?.is_vendor);
        setUsername((data?.username as string | null) ?? null);
        setAvatarUrl((data?.avatar_url as string | null) ?? null);
        setIsVendor(vendor);
        writeVendorCache(wallet, vendor);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, connected, connecting, wallet, walletAddress]);

  return useMemo(
    () => ({
      connected,
      wallet,
      username,
      avatarUrl,
      isVendor,
      loading,
    }),
    [avatarUrl, connected, isVendor, loading, username, wallet]
  );
}

export function SidebarUserProvider({ children }: { children: ReactNode }) {
  const value = useSidebarUserState();

  return (
    <SidebarUserContext.Provider value={value}>
      {children}
    </SidebarUserContext.Provider>
  );
}

export function useSidebarUser(): SidebarUserState {
  const context = useContext(SidebarUserContext);
  if (!context) {
    throw new Error("useSidebarUser must be used within SidebarUserProvider");
  }

  return context;
}
