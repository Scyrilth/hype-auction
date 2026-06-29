import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, type Cluster } from "@solana/web3.js";

export type SolanaCluster = "devnet" | "mainnet-beta";

function readNetworkEnv(): string {
  return (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet").toLowerCase();
}

/** Resolved cluster from NEXT_PUBLIC_SOLANA_NETWORK (defaults to devnet). */
export function getSolanaCluster(): SolanaCluster {
  return readNetworkEnv() === "devnet" ? "devnet" : "mainnet-beta";
}

export function isSolanaDevnet(): boolean {
  return getSolanaCluster() === "devnet";
}

export function getWalletAdapterNetwork(): WalletAdapterNetwork {
  return isSolanaDevnet()
    ? WalletAdapterNetwork.Devnet
    : WalletAdapterNetwork.Mainnet;
}

/**
 * Inlined at build time for client bundles.
 * Always prefer NEXT_PUBLIC_SOLANA_RPC_URL when set (e.g. Helius mainnet).
 */
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  clusterApiUrl(getSolanaCluster() as Cluster);

/** @deprecated Use SOLANA_RPC_URL or createSolanaConnection() */
export function getSolanaRpcUrl(): string {
  return SOLANA_RPC_URL;
}

/** Shared Connection for balances, escrow, and transactions. */
export function createSolanaConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}
