import { WalletReadyState } from "@solana/wallet-adapter-base";

export type WalletListEntry = {
  adapter: { name: string };
  readyState: WalletReadyState;
};

export function isPhantomExtensionPresent(): boolean {
  if (typeof window === "undefined") return false;

  const win = window as Window & {
    phantom?: { solana?: unknown };
    solana?: unknown;
  };

  return Boolean(win.phantom?.solana ?? win.solana);
}

/** True when Phantom can be used (extension injected or adapter reports installed). */
export function isPhantomWalletAvailable(wallets: WalletListEntry[]): boolean {
  if (isPhantomExtensionPresent()) return true;

  if (wallets.length === 0) return false;

  const phantom = wallets.find((wallet) => wallet.adapter.name === "Phantom");
  if (!phantom) return false;

  return (
    phantom.readyState === WalletReadyState.Installed ||
    phantom.readyState === WalletReadyState.Loadable
  );
}
