import { clusterApiUrl, type Cluster } from "@solana/web3.js";

export type SolanaCluster = "devnet" | "mainnet-beta";

/** Resolved cluster from NEXT_PUBLIC_SOLANA_NETWORK (defaults to devnet). */
export function getSolanaCluster(): SolanaCluster {
  const network = (
    process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
  ).toLowerCase();

  if (network === "devnet") {
    return "devnet";
  }

  return "mainnet-beta";
}

export function isSolanaDevnet(): boolean {
  return getSolanaCluster() === "devnet";
}

/**
 * RPC endpoint for wallet adapter + escrow.
 * Prefers NEXT_PUBLIC_SOLANA_RPC_URL, then clusterApiUrl for the configured network.
 */
export function getSolanaRpcUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (configured) {
    return configured;
  }

  return clusterApiUrl(getSolanaCluster() as Cluster);
}
