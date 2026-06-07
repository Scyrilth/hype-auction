"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CopyIcon } from "@/components/icons";
import StarRating from "@/components/shop/StarRating";
import { useToast } from "@/components/ui/Toast";
import type { SellerDashboardStats } from "@/lib/dashboard";
import type { User } from "@/lib/database.types";
import { formatSol, shortenAddress } from "@/lib/format";

export default function DashboardProfileSummary({
  profile,
  walletAddress,
  stats,
}: {
  profile: User | null;
  walletAddress: string;
  stats: SellerDashboardStats;
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const displayName =
    profile?.shop_name?.trim() ||
    profile?.username?.trim() ||
    shortenAddress(walletAddress);

  const shopHref = profile?.username?.trim()
    ? `/shop/${profile.username.trim()}`
    : `/shop/${walletAddress}`;

  const showCopyWallet = profile?.show_copy_wallet ?? true;

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      showToast("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy address.", "error");
    }
  };

  const statItems = [
    { label: "Total Listings", value: stats.totalListings },
    { label: "Active Auctions", value: stats.activeAuctions },
    { label: "Total Bids Received", value: stats.totalBidsReceived },
    { label: "Total Volume", value: formatSol(stats.totalVolume) },
    { label: "Followers", value: stats.followers },
    {
      label: "Average Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative h-28 bg-surface-elevated sm:h-32">
        {profile?.banner_image ? (
          <Image
            src={profile.banner_image}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/50 via-purple-900/80 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>

      <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        <div className="-mt-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-4 border-surface bg-surface-elevated sm:h-20 sm:w-20">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-lg font-bold text-accent">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="break-words text-xl font-bold leading-tight text-white sm:text-2xl">
                {displayName}
              </h1>
              {profile?.username?.trim() && (
                <p className="mt-0.5 break-all text-sm text-muted">
                  @{profile.username.trim()}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="break-all font-mono text-xs text-muted">
                  {shortenAddress(walletAddress, 6)}
                </p>
                {showCopyWallet && (
                  <button
                    type="button"
                    onClick={handleCopyWallet}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-muted transition-colors hover:border-accent/50 hover:text-white"
                    aria-label="Copy wallet address"
                    title="Copy wallet address"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/dashboard/create"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Create New Listing
            </Link>
            <Link
              href={shopHref}
              className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
            >
              View Shop
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
            >
              Shop Settings
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-background/60 px-3 py-3 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {item.label === "Average Rating" && stats.averageRating > 0 ? (
                  <span className="inline-flex flex-col items-center gap-1">
                    {item.value}
                    <StarRating rating={stats.averageRating} />
                  </span>
                ) : (
                  item.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
