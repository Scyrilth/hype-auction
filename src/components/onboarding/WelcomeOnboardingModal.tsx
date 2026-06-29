"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getErrorMessage } from "@/lib/errors";
import { isOnboarded, markOnboarded } from "@/lib/onboarding";
import { createUserRecord, getUserByWallet, type OnboardingIntent } from "@/lib/users";

type WelcomeOnboardingModalProps = {
  open: boolean;
  onClose: () => void;
};

function OptionCard({
  title,
  description,
  iconClass,
  onClick,
  loading,
}: {
  title: string;
  description: string;
  iconClass: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex flex-1 flex-col items-start rounded-2xl border border-border bg-surface-elevated p-5 text-left transition-all duration-150 ease-in-out hover:scale-[1.02] hover:border-accent/40 hover:bg-accent/10 disabled:opacity-60"
    >
      <i className={`${iconClass} mb-3 text-2xl text-purple-300`} />
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </button>
  );
}

export default function WelcomeOnboardingModal({
  open,
  onClose,
}: WelcomeOnboardingModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { client } = useSupabaseClient();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleChoice = useCallback(
    async (intent: OnboardingIntent) => {
      if (!publicKey || loading) return;

      const wallet = publicKey.toBase58();
      setLoading(true);
      try {
        await createUserRecord(wallet, intent, client);
        markOnboarded(wallet);
        onClose();

        if (intent === "buy") {
          router.refresh();
          return;
        }

        router.push("/dashboard/settings?sellerSetup=1");
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    },
    [client, loading, onClose, publicKey, router, showToast]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        <h2 id="welcome-modal-title" className="text-2xl font-bold text-white">
          Welcome to Hype Auction
        </h2>
        <p className="mt-2 text-sm text-muted">What brings you here?</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <OptionCard
            title="I want to buy"
            description="Bid on rare collectibles, sneakers, streetwear and more"
            iconClass="ti ti-shopping-bag"
            loading={loading}
            onClick={() => void handleChoice("buy")}
          />
          <OptionCard
            title="I want to sell"
            description="List your items and reach collectors worldwide"
            iconClass="ti ti-building-store"
            loading={loading}
            onClick={() => void handleChoice("sell")}
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void handleChoice("both")}
          className="mt-4 text-sm font-medium text-accent transition-colors hover:text-purple-300 disabled:opacity-60"
        >
          I want to do both
        </button>
      </div>
    </div>
  );
}

export function WelcomeOnboardingGate() {
  const { connected, publicKey, connecting } = useWallet();
  const { client } = useSupabaseClient();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey || connecting) {
      setOpen(false);
      setChecked(false);
      return;
    }

    const wallet = publicKey.toBase58();
    if (isOnboarded(wallet)) {
      setOpen(false);
      setChecked(true);
      return;
    }

    let cancelled = false;

    void getUserByWallet(wallet, client)
      .then((user) => {
        if (cancelled) return;
        if (user) {
          markOnboarded(wallet);
          setOpen(false);
        } else {
          setOpen(true);
        }
        setChecked(true);
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [client, connected, connecting, publicKey]);

  if (!checked && connected) return null;

  return <WelcomeOnboardingModal open={open} onClose={() => setOpen(false)} />;
}
