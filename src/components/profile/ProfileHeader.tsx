"use client";

import Image from "next/image";
import { useState } from "react";

import { CopyIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import SpecialBadges from "@/components/ui/SpecialBadges";
import { useToast } from "@/components/ui/Toast";
import type { User } from "@/lib/database.types";
import { shortenAddress } from "@/lib/format";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}

function formatMemberSince(iso: string) {
  return `Member since ${new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

export default function ProfileHeader({
  user,
  strikeCount,
}: {
  user: User;
  strikeCount?: number;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const displayName = user.username ?? shortenAddress(user.wallet_address, 6);
  const showCopyWallet = user.show_copy_wallet ?? true;

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      showToast("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy address.", "error");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative h-40 w-full bg-surface-elevated sm:h-48">
        {user.banner_image ? (
          <Image
            src={user.banner_image}
            alt={`${displayName} banner`}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/50 via-purple-900/80 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
          <div className="flex items-end gap-4">
            <UserAvatar
              walletAddress={user.wallet_address}
              avatarUrl={user.avatar_url}
              alt={displayName}
              size="3xl"
              rounded="xl"
              className="border-4 border-surface"
            />

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {user.username ? `@${user.username.replace(/^@+/, "")}` : displayName}
                </h1>
                <SpecialBadges walletAddress={user.wallet_address} />
                {typeof strikeCount === "number" && strikeCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                    {strikeCount} strike{strikeCount === 1 ? "" : "s"}
                  </span>
                )}
                {user.is_verified && <VerifiedBadge />}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs text-zinc-400">
                  {shortenAddress(user.wallet_address, 6)}
                </p>
                {showCopyWallet && (
                  <button
                    type="button"
                    onClick={handleCopyWallet}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-muted transition-colors hover:border-accent/50 hover:text-white"
                    aria-label="Copy wallet address"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-muted">
                {formatMemberSince(user.created_at)}
              </p>
            </div>
          </div>
        </div>

        {user.bio && (
          <p className="mt-5 text-sm leading-relaxed text-zinc-300">{user.bio}</p>
        )}
      </div>
    </section>
  );
}
