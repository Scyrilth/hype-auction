"use client";

import Image from "next/image";
import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import type { SellerDashboardStats } from "@/lib/dashboard";
import type { User } from "@/lib/database.types";
import { formatSol, shortenAddress } from "@/lib/format";

export default function DashboardProfileSummary({
  profile,
  shopSlug,
  walletAddress,
  stats,
}: {
  profile: User | null;
  shopSlug: string;
  walletAddress: string;
  stats: SellerDashboardStats;
}) {
  const displayName =
    profile?.shop_name ??
    profile?.username ??
    shortenAddress(walletAddress);

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
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
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
            <div className="min-w-0 pb-1">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                {displayName}
              </h1>
              {profile?.username && (
                <p className="truncate text-sm text-muted">
                  @{profile.username}
                </p>
              )}
              <p className="mt-0.5 truncate font-mono text-xs text-muted">
                {shortenAddress(walletAddress, 6)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/create"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Create New Listing
            </Link>
            <Link
              href={`/shop/${shopSlug}`}
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
