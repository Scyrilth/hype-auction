"use client";

import { useWalletInstall } from "@/components/wallet/WalletInstallProvider";

export function usePhantomConnect() {
  const { connectWallet } = useWalletInstall();
  return connectWallet;
}
