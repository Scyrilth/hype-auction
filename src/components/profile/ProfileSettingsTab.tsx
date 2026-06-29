"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { updateProfilePrivacy } from "@/lib/profile";
import { upsertUser } from "@/lib/users";

export default function ProfileSettingsTab({
  initialShowWonAuctions,
}: {
  initialShowWonAuctions: boolean;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [showWonAuctions, setShowWonAuctions] = useState(initialShowWonAuctions);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!publicKey) return;

    setSaving(true);
    try {
      const wallet = publicKey.toBase58();
      await upsertUser(wallet, client);
      await updateProfilePrivacy(wallet, showWonAuctions, client);
      showToast("Privacy settings saved.");
      router.refresh();
    } catch (error) {
      logSupabaseError("ProfileSettingsTab.save", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-white">Privacy</h2>
      <p className="mt-1 text-sm text-muted">
        Control what other users can see on your public profile.
      </p>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-elevated p-4">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="show-won-auctions"
            className="text-sm font-medium text-white"
          >
            Show my won auctions publicly
          </label>
          <p className="mt-1 text-sm text-muted">
            When enabled, other users can see your Won Auctions tab on your
            public profile.
          </p>
        </div>

        <button
          id="show-won-auctions"
          type="button"
          role="switch"
          aria-checked={showWonAuctions}
          onClick={() => setShowWonAuctions((value) => !value)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            showWonAuctions ? "bg-accent" : "bg-surface"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              showWonAuctions ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
