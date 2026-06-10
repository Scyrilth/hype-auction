"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { isAdminWallet } from "@/lib/admin/config";

export function useIsAdmin() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const isAdmin = connected && isAdminWallet(wallet);

  return { connected, wallet, isAdmin };
}
