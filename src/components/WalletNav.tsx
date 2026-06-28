"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { ChevronDownIcon } from "@/components/icons";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { shortenAddress } from "@/lib/format";

export default function WalletNav() {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const connectPhantom = usePhantomConnect();

  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch {
        if (!cancelled) setBalance(null);
      }
    };

    fetchBalance();

    const subId = connection.onAccountChange(publicKey, (account) => {
      setBalance(account.lamports / LAMPORTS_PER_SOL);
    });

    return () => {
      cancelled = true;
      connection.removeAccountChangeListener(subId);
    };
  }, [connection, publicKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      await connectPhantom();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }, [connectPhantom]);

  const handleCopyAddress = useCallback(async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey.toBase58());
    setMenuOpen(false);
  }, [publicKey]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setMenuOpen(false);
  }, [disconnect]);

  if (!connected || !publicKey) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-white transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  const address = shortenAddress(publicKey.toBase58());
  const balanceLabel =
    balance !== null ? `${balance.toFixed(2)} SOL` : "— SOL";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:border-accent"
      >
        <span className="font-medium text-white">{balanceLabel}</span>
        <span className="text-border">|</span>
        <span className="font-mono text-zinc-300">{address}</span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-muted" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
          >
            Copy address
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
