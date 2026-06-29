"use client";

import { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { WalletInstallProvider } from "@/components/wallet/WalletInstallProvider";
import { getSolanaCluster, getSolanaRpcUrl } from "@/lib/solana-config";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = useMemo(() => getSolanaRpcUrl(), []);
  const network = useMemo(
    () =>
      getSolanaCluster() === "mainnet-beta"
        ? WalletAdapterNetwork.Mainnet
        : WalletAdapterNetwork.Devnet,
    []
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletInstallProvider>{children}</WalletInstallProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
