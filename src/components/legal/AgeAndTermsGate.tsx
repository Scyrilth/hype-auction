"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import AgeAndTermsGateModal from "@/components/legal/AgeAndTermsGateModal";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getErrorMessage } from "@/lib/errors";
import {
  acceptAgeAndTerms,
  getUserByWallet,
  hasAcceptedTerms,
} from "@/lib/users";

export default function AgeAndTermsGate() {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);
  const pendingDisconnectRef = useRef(false);

  const handleDecline = useCallback(async () => {
    pendingDisconnectRef.current = true;
    setOpen(false);
    setResolved(true);
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, [disconnect]);

  useEffect(() => {
    if (!connected || !publicKey || connecting) {
      setOpen(false);
      setResolved(false);
      pendingDisconnectRef.current = false;
      return;
    }

    const wallet = publicKey.toBase58();
    let cancelled = false;

    void getUserByWallet(wallet, client)
      .then((user) => {
        if (cancelled || pendingDisconnectRef.current) return;
        if (hasAcceptedTerms(user)) {
          setOpen(false);
        } else {
          setOpen(true);
        }
        setResolved(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("AgeAndTermsGate: failed to load user", error);
        setOpen(true);
        setResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [client, connected, connecting, publicKey]);

  useEffect(() => {
    if (!open) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open]);

  const handleContinue = async () => {
    if (!publicKey || loading) return;

    const wallet = publicKey.toBase58();
    setLoading(true);
    try {
      await acceptAgeAndTerms(wallet, client);
      setOpen(false);
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to save your confirmation."), "error");
    } finally {
      setLoading(false);
    }
  };

  if (connected && !resolved) {
    return null;
  }

  return (
    <AgeAndTermsGateModal
      open={open}
      loading={loading}
      onContinue={() => void handleContinue()}
      onDecline={() => void handleDecline()}
    />
  );
}
