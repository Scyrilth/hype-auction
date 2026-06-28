"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnection,
  useWallet,
  type Wallet,
} from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { ChevronDownIcon } from "@/components/icons";
import AnchoredPortal from "@/components/ui/AnchoredPortal";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { shortenAddress, truncateWalletAddress } from "@/lib/format";

function isSelectableWallet(wallet: Wallet) {
  return (
    wallet.readyState === WalletReadyState.Installed ||
    wallet.readyState === WalletReadyState.Loadable
  );
}

export default function WalletNav() {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    wallets,
    select,
    connect,
    wallet,
  } = useWallet();
  const connectPhantom = usePhantomConnect();

  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchMode, setSwitchMode] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectableWallets = wallets.filter(isSelectableWallet);

  useEffect(() => {
    if (!menuOpen) {
      setSwitchMode(false);
    }
  }, [menuOpen]);

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
      setSwitchMode(false);
      setMenuOpen(false);
    }
  }, [disconnect]);

  const handleSelectWallet = useCallback(
    async (walletName: WalletName) => {
      try {
        if (wallet?.adapter.name !== walletName) {
          await disconnect();
        }
        select(walletName);
        await connect();
      } catch (error) {
        console.error("Wallet selection failed:", error);
      } finally {
        setSwitchMode(false);
        setMenuOpen(false);
      }
    },
    [connect, disconnect, select, wallet?.adapter.name]
  );

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

  const fullAddress = publicKey.toBase58();
  const displayAddress = truncateWalletAddress(fullAddress);
  const triggerAddress = shortenAddress(fullAddress);
  const balanceLabel =
    balance !== null ? `${balance.toFixed(2)} SOL` : "— SOL";

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex max-w-[5.5rem] items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] transition-colors hover:border-accent sm:max-w-none sm:px-2"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="shrink-0 font-medium text-white">{balanceLabel}</span>
        <span className="hidden text-border lg:inline">|</span>
        <span className="hidden truncate font-mono text-zinc-300 lg:inline xl:max-w-[4.5rem]">
          {triggerAddress}
        </span>
        <ChevronDownIcon className="h-3 w-3 shrink-0 text-muted" />
      </button>

      <AnchoredPortal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={triggerRef}
        align="end"
        className="pointer-events-auto min-w-0 overflow-hidden overflow-x-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg md:min-w-[200px] max-md:max-h-[80vh] max-md:overflow-y-auto"
      >
        {switchMode ? (
          <div className="pointer-events-auto">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-xs font-medium text-white">Select wallet</p>
              <button
                type="button"
                onClick={() => setSwitchMode(false)}
                className="touch-manipulation text-xs text-muted transition-colors hover:text-white"
              >
                Back
              </button>
            </div>

            <div className="py-1">
              {selectableWallets.map((walletOption) => (
                <button
                  key={walletOption.adapter.name}
                  type="button"
                  onClick={() => void handleSelectWallet(walletOption.adapter.name)}
                  className="flex w-full touch-manipulation items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
                >
                  {walletOption.adapter.icon ? (
                    <img
                      src={walletOption.adapter.icon}
                      alt=""
                      className="h-5 w-5 shrink-0 rounded"
                    />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface text-[10px] text-muted">
                      W
                    </span>
                  )}
                  <span className="min-w-0 whitespace-nowrap">
                    {walletOption.adapter.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-[11px] text-muted">Balance</p>
              <p className="text-sm font-semibold text-white">{balanceLabel}</p>
              <p
                className="mt-1 truncate font-mono text-xs text-zinc-400"
                title={fullAddress}
              >
                {displayAddress}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAddress}
              className="flex w-full touch-manipulation items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
            >
              <i className="ti ti-copy shrink-0 text-base leading-none" aria-hidden />
              <span className="min-w-0 whitespace-nowrap">Copy address</span>
            </button>

            <div className="border-t border-border" />

            <button
              type="button"
              onClick={() => setSwitchMode(true)}
              className="flex w-full touch-manipulation items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-background hover:text-white"
            >
              <i
                className="ti ti-switch-horizontal shrink-0 text-base leading-none"
                aria-hidden
              />
              <span className="min-w-0 whitespace-nowrap">Switch wallet</span>
            </button>

            <div className="border-t border-border" />

            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="flex w-full touch-manipulation items-center gap-2 px-4 py-2 text-left text-sm text-live-red transition-colors hover:bg-live-red/10"
            >
              <i className="ti ti-logout shrink-0 text-base leading-none" aria-hidden />
              <span className="min-w-0 whitespace-nowrap">Disconnect Wallet</span>
            </button>
          </div>
        )}
      </AnchoredPortal>
    </div>
  );
}
