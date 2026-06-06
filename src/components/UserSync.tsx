"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { upsertUser } from "@/lib/users";

export default function UserSync() {
  const { publicKey, connected } = useWallet();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      syncedRef.current = null;
      return;
    }

    const walletAddress = publicKey.toBase58();
    if (syncedRef.current === walletAddress) return;

    upsertUser(walletAddress)
      .then(() => {
        syncedRef.current = walletAddress;
      })
      .catch((error) => {
        console.error("Failed to sync user to Supabase:", error);
      });
  }, [connected, publicKey]);

  return null;
}
