"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AgeAndTermsGateModalProps = {
  open: boolean;
  loading: boolean;
  onContinue: () => void;
  onDecline: () => void;
};

export default function AgeAndTermsGateModal({
  open,
  loading,
  onContinue,
  onDecline,
}: AgeAndTermsGateModalProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);

  useEffect(() => {
    if (!open) {
      setAgeConfirmed(false);
      setTosAccepted(false);
    }
  }, [open]);

  if (!open) return null;

  const canContinue = ageConfirmed && tosAccepted && !loading;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-terms-gate-title"
      >
        <h2
          id="age-terms-gate-title"
          className="text-xl font-bold text-white"
        >
          Before you continue
        </h2>
        <p className="mt-2 text-sm text-muted">
          Before you continue, please confirm the following:
        </p>

        <div className="mt-6 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(event) => setAgeConfirmed(event.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
            />
            <span className="text-sm text-zinc-300">
              I confirm I am at least 18 years old
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3">
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(event) => setTosAccepted(event.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
            />
            <span className="text-sm text-zinc-300">
              I agree to the{" "}
              <Link
                href="/tos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent underline-offset-2 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent underline-offset-2 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onDecline}
          className="mt-3 w-full text-center text-sm text-muted transition-colors hover:text-zinc-300 disabled:opacity-50"
        >
          I don&apos;t agree — disconnect wallet
        </button>
      </div>
    </div>
  );
}
