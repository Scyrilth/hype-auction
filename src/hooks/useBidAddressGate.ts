"use client";

import { useCallback, useState } from "react";

import type { ShippingAddress } from "@/lib/database.types";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getShippingAddresses } from "@/lib/shipping";

const SESSION_KEY = "bid_address_confirmed";

function isSessionConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function markSessionConfirmed(): void {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function useBidAddressGate() {
  const { client, walletAddress } = useSupabaseClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [pendingBid, setPendingBid] = useState<(() => Promise<void>) | null>(
    null
  );

  const gateBid = useCallback(
    async (bidFn: () => Promise<void>) => {
      if (!walletAddress) {
        await bidFn();
        return;
      }

      if (isSessionConfirmed()) {
        await bidFn();
        return;
      }

      setLoadingAddresses(true);
      try {
        const saved = await getShippingAddresses(walletAddress, client);
        setAddresses(saved);

        if (saved.length === 0) {
          setPendingBid(() => bidFn);
          setModalOpen(true);
          return;
        }

        setPendingBid(() => bidFn);
        setModalOpen(true);
      } finally {
        setLoadingAddresses(false);
      }
    },
    [client, walletAddress]
  );

  const handleContinue = useCallback(async () => {
    if (!addresses.length) return;
    markSessionConfirmed();
    setModalOpen(false);
    const bid = pendingBid;
    setPendingBid(null);
    if (bid) await bid();
  }, [addresses.length, pendingBid]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPendingBid(null);
  }, []);

  return {
    modalOpen,
    addresses,
    loadingAddresses,
    gateBid,
    handleContinue,
    closeModal,
  };
}
