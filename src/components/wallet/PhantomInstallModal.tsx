"use client";

import { useEffect } from "react";

const PHANTOM_INSTALL_URL = "https://phantom.app";

type PhantomInstallModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function PhantomInstallModal({
  open,
  onClose,
}: PhantomInstallModalProps) {
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phantom-install-title"
      >
        <h2
          id="phantom-install-title"
          className="text-xl font-bold text-white sm:text-2xl"
        >
          You need Phantom Wallet to use Hype Auction
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Hype Auction uses Phantom to connect your Solana wallet. Install the
          browser extension, then refresh this page so we can detect it.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={PHANTOM_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Install Phantom
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/50 hover:bg-background"
          >
            I already have it — Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
