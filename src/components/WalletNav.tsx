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
      <div className="group relative shrink-0">
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>

        <p
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden w-max max-w-[12rem] -translate-x-1/2 rounded-md border border-border bg-surface-elevated px-2 py-1 text-center text-[10px] leading-snug text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block"
          role="tooltip"
        >
          Connect your Phantom wallet to start bidding
        </p>

        <p className="pointer-events-none absolute right-0 top-full z-50 mt-0.5 w-max max-w-[9.5rem] text-right text-[10px] leading-snug text-muted md:hidden">
          On mobile? Use the Phantom app browser at phantom.app
        </p>
      </div>
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
        className="flex max-w-[7.5rem] items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] transition-colors hover:border-accent sm:max-w-none"
      >
        <span className="shrink-0 font-medium text-white">{balanceLabel}</span>
        <span className="hidden text-border lg:inline">|</span>
        <span className="hidden truncate font-mono text-zinc-300 lg:inline xl:max-w-[4.5rem]">
          {address}
        </span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 text-muted" />
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
