"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CopyIcon } from "@/components/icons";
import StarRating from "@/components/shop/StarRating";
import FiatValue from "@/components/ui/FiatValue";
import UserAvatar from "@/components/ui/UserAvatar";
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

  const shopName = profile?.shop_name?.trim() || null;
  const username = profile?.username?.replace(/^@+/, "").trim() || null;
  const titleLine =
    shopName || username || shortenAddress(walletAddress, 6);

  const shopHref = username
    ? `/shop/${username}`
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

  const statItems: {
    label: string;
    value: string | number;
    fiatSolAmount?: number;
  }[] = [
    { label: "Total Listings", value: stats.totalListings },
    { label: "Active Auctions", value: stats.activeAuctions },
    { label: "Total Bids Received", value: stats.totalBidsReceived },
    {
      label: "Total Volume",
      value: formatSol(stats.totalVolume),
      fiatSolAmount: stats.totalVolume,
    },
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
            <UserAvatar
              walletAddress={walletAddress}
              avatarUrl={profile?.avatar_url}
              alt={titleLine}
              size="2xl"
              rounded="xl"
              className="border-4 border-surface"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="break-words text-2xl font-bold text-white">
                {titleLine}
              </h1>
              {shopName && username ? (
                <p className="mt-1 break-all text-sm text-muted">
                  @{username}
                </p>
              ) : null}
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

        <div className="mt-4 flex justify-end">
          <Link
            href="/transactions"
            className="text-sm font-medium text-accent transition-colors hover:text-purple-300"
          >
            View Transactions →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
              {item.fiatSolAmount !== undefined && (
                <div className="mt-0.5 flex justify-center">
                  <FiatValue solAmount={item.fiatSolAmount} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
