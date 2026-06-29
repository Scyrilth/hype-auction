"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import ImageUpload from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { updateBuyerProfileSettings } from "@/lib/profile";
import { getImageExtension } from "@/lib/storage";
import { upsertUser } from "@/lib/users";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-muted";

export default function ProfileAccountSettingsTab({
  initialUsername,
  initialBio,
  initialAvatarUrl,
  walletAddress: _walletAddress,
}: {
  initialUsername: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  walletAddress: string;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!publicKey) return;

    setSaving(true);
    try {
      const wallet = publicKey.toBase58();
      await upsertUser(wallet, client);
      await updateBuyerProfileSettings(
        wallet,
        {
          username,
          bio: bio.slice(0, 160),
          avatarUrl,
        },
        client
      );
      showToast("Profile settings saved.");
      router.refresh();
    } catch (error) {
      console.error("ProfileAccountSettingsTab.save", error);
      logSupabaseError("ProfileAccountSettingsTab.save", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-white">Settings</h2>
      <p className="mt-1 text-sm text-muted">
        Update your public profile details.
      </p>

      <div className="mt-6 space-y-6">
        <ImageUpload
          label="Avatar"
          bucket="Avatars"
          variant="avatar"
          maxSizeMb={5}
          walletAddress={publicKey?.toBase58()}
          value={avatarUrl}
          onChange={setAvatarUrl}
          buildPath={(file) =>
            `${publicKey!.toBase58()}/avatar.${getImageExtension(file)}`
          }
          onUploaded={async (url) => {
            if (!publicKey) return;

            try {
              const wallet = publicKey.toBase58();
              await upsertUser(wallet, client);
              await updateBuyerProfileSettings(
                wallet,
                {
                  username,
                  bio: bio.slice(0, 160),
                  avatarUrl: url,
                },
                client
              );
              setAvatarUrl(url);
              showToast("Avatar uploaded!");
              router.refresh();
            } catch (error) {
              console.error("ProfileAccountSettingsTab.avatarUpload", error);
              logSupabaseError("ProfileAccountSettingsTab.avatarUpload", error);
              throw error;
            }
          }}
          disabled={!publicKey}
        />

        <label className="block">
          <span className={labelClass}>Display name / username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your display name"
            className={inputClass}
            maxLength={40}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 160))}
            placeholder="Tell collectors a little about yourself"
            rows={4}
            className={`${inputClass} resize-y`}
            maxLength={160}
          />
          <p className="mt-1.5 text-right text-xs text-muted">{bio.length}/160</p>
        </label>
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
