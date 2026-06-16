"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import PhantomInstallModal from "@/components/wallet/PhantomInstallModal";
import { isPhantomWalletAvailable } from "@/lib/wallet-detection";

type WalletInstallContextValue = {
  connectWallet: () => Promise<void>;
  showInstallPrompt: () => void;
};

const WalletInstallContext = createContext<WalletInstallContextValue | null>(
  null
);

export function WalletInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connect, select, wallets, connected } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const walletActionAttemptedRef = useRef(false);

  const showInstallPrompt = useCallback(() => {
    walletActionAttemptedRef.current = true;
    setModalOpen(true);
  }, []);

  const connectWallet = useCallback(async () => {
    if (!isPhantomWalletAvailable(wallets)) {
      showInstallPrompt();
      return;
    }

    try {
      const phantom = wallets.find((wallet) => wallet.adapter.name === "Phantom");
      if (phantom) {
        select(phantom.adapter.name);
      }
      await connect();
    } catch (error) {
      if (!isPhantomWalletAvailable(wallets)) {
        showInstallPrompt();
        return;
      }
      throw error;
    }
  }, [connect, select, showInstallPrompt, wallets]);

  useEffect(() => {
    if (!walletActionAttemptedRef.current || connected) return;

    if (!isPhantomWalletAvailable(wallets)) {
      setModalOpen(true);
    }
  }, [connected, wallets]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!walletActionAttemptedRef.current || connected) return;
      if (!isPhantomWalletAvailable(wallets)) {
        setModalOpen(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [connected, wallets]);

  const value: WalletInstallContextValue = {
    connectWallet,
    showInstallPrompt,
  };

  return (
    <WalletInstallContext.Provider value={value}>
      {children}
      <PhantomInstallModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </WalletInstallContext.Provider>
  );
}

export function useWalletInstall() {
  const context = useContext(WalletInstallContext);
  if (!context) {
    throw new Error("useWalletInstall must be used within WalletInstallProvider");
  }
  return context;
}
