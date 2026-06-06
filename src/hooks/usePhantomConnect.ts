"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function usePhantomConnect() {
  const { connect, select, wallets } = useWallet();

  return useCallback(async () => {
    const phantom = wallets.find((w) => w.adapter.name === "Phantom");
    if (phantom) {
      select(phantom.adapter.name);
    }
    await connect();
  }, [wallets, select, connect]);
}
