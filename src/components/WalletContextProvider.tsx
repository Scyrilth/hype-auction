"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { WalletInstallProvider } from "@/components/wallet/WalletInstallProvider";
import {
  getWalletAdapterNetwork,
  SOLANA_RPC_URL,
} from "@/lib/solana-config";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = useMemo(() => getWalletAdapterNetwork(), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter({ network })],
    [network]
  );

  return (
    <ConnectionProvider
      endpoint={SOLANA_RPC_URL}
      config={{ commitment: "confirmed" }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletInstallProvider>{children}</WalletInstallProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
