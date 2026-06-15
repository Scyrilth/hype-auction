"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { getUserByWallet } from "@/lib/users";

/** Ensures returning users are recognized without auto-creating new accounts. */
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

    getUserByWallet(walletAddress)
      .then(() => {
        syncedRef.current = walletAddress;
      })
      .catch((error) => {
        console.error("Failed to check user record:", error);
      });
  }, [connected, publicKey]);

  return null;
}
