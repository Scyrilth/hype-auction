"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

import {
  adminReleaseToSeller,
  autoRefundOnChain,
  createEscrowProvider,
  resolveDisputeOnChain,
} from "@/lib/escrow";

export function useAdminEscrow() {
  const { connection } = useConnection();
  const wallet = useWallet();
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
          buyerWallet
        );
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet]
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
            false
          );
        }
        return await autoRefundOnChain(auctionId, buyerWallet, provider);
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet]
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
          sellerWins
        );
      } finally {
        setLoading(false);
      }
    },
    [getProvider, wallet]
  );

  return { loading, releaseToSeller, refundToBuyer, resolveDispute };
}
