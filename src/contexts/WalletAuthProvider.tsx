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

import { getErrorMessage } from "@/lib/errors";
import {
  clearWalletAuthSession,
  getWalletAuthSession,
  setWalletAuthSession,
  uint8ArrayToBase64,
} from "@/lib/wallet-auth-client";

type WalletAuthContextValue = {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
};

const WalletAuthContext = createContext<WalletAuthContextValue>({
  isAuthenticating: false,
  isAuthenticated: false,
});

export function useWalletAuth() {
  return useContext(WalletAuthContext);
}

export function WalletAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publicKey, connected, signMessage } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authWalletRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const expiresAtRef = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    authWalletRef.current = null;
    expiresAtRef.current = null;
    clearWalletAuthSession();
    setIsAuthenticated(false);
  }, []);

  const authenticate = useCallback(
    async (walletAddress: string) => {
      if (inFlightRef.current) return;

      if (
        authWalletRef.current === walletAddress &&
        expiresAtRef.current &&
        expiresAtRef.current > Date.now()
      ) {
        setIsAuthenticated(true);
        return;
      }

      const storedSession = getWalletAuthSession();
      console.log("[WalletAuthProvider] checking stored session", {
        hasStoredSession: Boolean(storedSession),
        storedWallet: storedSession?.wallet,
        currentWallet: walletAddress,
        walletsMatch: storedSession?.wallet === walletAddress,
        storedExpiresAt: storedSession?.expiresAt,
        now: Date.now(),
        notExpired: storedSession ? storedSession.expiresAt > Date.now() : null,
      });
      if (
        storedSession &&
        storedSession.wallet === walletAddress &&
        storedSession.expiresAt > Date.now()
      ) {
        console.log("[WalletAuthProvider] restoring from sessionStorage, skipping re-auth");
        authWalletRef.current = storedSession.wallet;
        expiresAtRef.current = storedSession.expiresAt;
        setIsAuthenticated(true);
        return;
      }

      if (!signMessage) {
        clearSession();
        return;
      }

      inFlightRef.current = true;
      setIsAuthenticating(true);

      try {
        const challengeResponse = await fetch(
          `/api/auth/challenge?wallet=${encodeURIComponent(walletAddress)}`
        );
        const challengePayload = (await challengeResponse
          .json()
          .catch(() => ({}))) as {
          message?: string;
          error?: string;
        };

        if (!challengeResponse.ok || !challengePayload.message) {
          throw new Error(
            getErrorMessage(
              challengePayload.error,
              "Unable to start wallet sign-in."
            )
          );
        }

        const messageBytes = new TextEncoder().encode(challengePayload.message);
        const signature = await signMessage(messageBytes);

        const verifyResponse = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            message: challengePayload.message,
            signature: uint8ArrayToBase64(signature),
          }),
        });

        const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as {
          token?: string;
          expiresAt?: number;
          error?: string;
        };

        if (
          !verifyResponse.ok ||
          !verifyPayload.token ||
          !verifyPayload.expiresAt
        ) {
          throw new Error(
            getErrorMessage(verifyPayload.error, "Wallet sign-in failed.")
          );
        }

        authWalletRef.current = walletAddress;
        expiresAtRef.current = verifyPayload.expiresAt;
        setWalletAuthSession({
          token: verifyPayload.token,
          wallet: walletAddress,
          expiresAt: verifyPayload.expiresAt,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("[WalletAuthProvider] authentication failed:", error);
        clearSession();
      } finally {
        inFlightRef.current = false;
        setIsAuthenticating(false);
      }
    },
    [clearSession, signMessage]
  );

  useEffect(() => {
    if (!connected || !publicKey) {
      clearSession();
      return;
    }

    const walletAddress = publicKey.toBase58();
    if (authWalletRef.current && authWalletRef.current !== walletAddress) {
      clearSession();
    }

    void authenticate(walletAddress);
  }, [authenticate, clearSession, connected, publicKey]);

  useEffect(() => {
    if (!connected || !publicKey || !expiresAtRef.current) return;

    const remainingMs = expiresAtRef.current - Date.now();
    if (remainingMs <= 0) {
      clearSession();
      void authenticate(publicKey.toBase58());
      return;
    }

    const timer = window.setTimeout(() => {
      clearSession();
      void authenticate(publicKey.toBase58());
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [authenticate, clearSession, connected, isAuthenticated, publicKey]);

  return (
    <WalletAuthContext.Provider value={{ isAuthenticating, isAuthenticated }}>
      {children}
    </WalletAuthContext.Provider>
  );
}
