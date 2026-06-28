"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { ChevronDownIcon } from "@/components/icons";
import AnchoredPortal from "@/components/ui/AnchoredPortal";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { shortenAddress } from "@/lib/format";

export default function WalletNav() {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const connectPhantom = usePhantomConnect();

  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    try {
      await disconnect();
    } catch (error) {
      console.error("Wallet disconnect failed:", error);
    } finally {
      setMenuOpen(false);
    }
  }, [disconnect]);

  const handleSwitchWallet = useCallback(async () => {
    setMenuOpen(false);
    try {
      await disconnect();
      await connectPhantom();
    } catch (error) {
      console.error("Wallet switch failed:", error);
    }
  }, [connectPhantom, disconnect]);

  if (!connected || !publicKey) {
    return (
      <div className="group relative z-10 shrink-0">
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={connecting}
          className="touch-manipulation rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-white transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>

        <p
          className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden w-max max-w-[12rem] -translate-x-1/2 rounded-md border border-border bg-surface-elevated px-2 py-1 text-center text-[10px] leading-snug text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block"
          role="tooltip"
        >
          Connect your Phantom wallet to start bidding
        </p>
      </div>
    );
  }

  const address = shortenAddress(publicKey.toBase58());
  const balanceLabel =
    balance !== null ? `${balance.toFixed(2)} SOL` : "— SOL";

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex max-w-[7.5rem] items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] transition-colors hover:border-accent sm:max-w-none"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="shrink-0 font-medium text-white">{balanceLabel}</span>
        <span className="hidden text-border lg:inline">|</span>
        <span className="hidden truncate font-mono text-zinc-300 lg:inline xl:max-w-[4.5rem]">
          {address}
        </span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 text-muted" />
      </button>

      <AnchoredPortal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={triggerRef}
        align="end"
        className="min-w-0 overflow-hidden overflow-x-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg md:min-w-[200px] max-md:max-h-[80vh] max-md:overflow-y-auto"
      >
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-[11px] text-muted">Balance</p>
          <p className="text-sm font-semibold text-white">{balanceLabel}</p>
          <p className="mt-1 break-all font-mono text-xs leading-relaxed text-zinc-400">
            {publicKey.toBase58()}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyAddress}
          className="flex w-full min-w-0 items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
        >
          <i className="ti ti-copy shrink-0 text-base leading-none" aria-hidden />
          <span className="min-w-0">Copy address</span>
        </button>

        <div className="border-t border-border" />

        <button
          type="button"
          onClick={() => void handleDisconnect()}
          className="flex w-full min-w-0 items-center gap-2 px-4 py-2 text-left text-sm text-live-red transition-colors hover:bg-live-red/10"
        >
          <i className="ti ti-logout shrink-0 text-base leading-none" aria-hidden />
          <span className="min-w-0 whitespace-nowrap">Disconnect Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => void handleSwitchWallet()}
          className="flex w-full min-w-0 items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
        >
          <i className="ti ti-switch-horizontal shrink-0 text-base leading-none" aria-hidden />
          <span className="min-w-0 whitespace-nowrap">Switch wallet</span>
        </button>
      </AnchoredPortal>
    </div>
  );
}
