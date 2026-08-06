"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  adminReleaseToSeller,
  autoRefundOnChain,
  createEscrowProvider,
  resolveDisputeOnChain,
} from "@/lib/escrow";

export function useAdminEscrow() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { client } = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  const getProvider = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Admin wallet not connected");
    }
    return createEscrowProvider(connection, wallet as never);
  }, [connection, wallet]);

  const releaseToSeller = useCallback(
    async (
      auctionId: string,
      escrowState: string,
      sellerWallet: string,
      buyerWallet: string
    ) => {
      setLoading(true);
      try {
        const provider = getProvider();
        return await adminReleaseToSeller(
          auctionId,
          escrowState,
          wallet as never,
          provider,
          sellerWallet,
          buyerWallet,
          client
        );
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet, client]
  );

  const refundToBuyer = useCallback(
    async (
      auctionId: string,
      buyerWallet: string,
      sellerWallet: string,
      escrowState: string
    ) => {
      setLoading(true);
      try {
        const provider = getProvider();
        if (escrowState === "disputed") {
          return await resolveDisputeOnChain(
            auctionId,
            wallet as never,
            provider,
            sellerWallet,
            buyerWallet,
            false,
            client
          );
        }
        return await autoRefundOnChain(auctionId, buyerWallet, provider, client);
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet, client]
  );

  const resolveDispute = useCallback(
    async (
      auctionId: string,
      sellerWallet: string,
      buyerWallet: string,
      sellerWins: boolean
    ) => {
      setLoading(true);
      try {
        const provider = getProvider();
        return await resolveDisputeOnChain(
          auctionId,
          wallet as never,
          provider,
          sellerWallet,
          buyerWallet,
          sellerWins,
          client
        );
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet, client]
  );

  return { loading, releaseToSeller, refundToBuyer, resolveDispute };
}
