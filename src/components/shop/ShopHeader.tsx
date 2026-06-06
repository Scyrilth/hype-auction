"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import FollowButton from "@/components/shop/FollowButton";
import StarRating from "@/components/shop/StarRating";
import type { User, VendorShopStats } from "@/lib/database.types";
import { formatSol, shortenAddress } from "@/lib/format";

const DEFAULT_BANNER =
  "https://placehold.co/1200x320/1a1a2e/7c3aed?text=Vendor+Shop";

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

export default function ShopHeader({
  vendor,
  stats,
  initialFollowing,
}: {
  vendor: User;
  stats: VendorShopStats;
  initialFollowing: boolean;
}) {
  const { publicKey } = useWallet();
  const [followersCount, setFollowersCount] = useState(stats.followers_count);

  const isOwner =
    publicKey?.toBase58() === vendor.wallet_address;

  const displayName =
    vendor.shop_name ?? vendor.username ?? shortenAddress(vendor.wallet_address);

  const bannerSrc = vendor.banner_url || DEFAULT_BANNER;
  const avatarSrc = vendor.avatar_url;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative h-40 w-full bg-surface-elevated sm:h-48">
        <Image
          src={bannerSrc}
          alt={`${displayName} banner`}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-surface-elevated sm:h-24 sm:w-24">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-xl font-bold text-accent">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {displayName}
                </h1>
                {vendor.is_verified && <VerifiedBadge />}
              </div>
              {vendor.username && (
                <p className="text-sm text-muted">@{vendor.username}</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                {shortenAddress(vendor.wallet_address, 6)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FollowButton
              vendorWallet={vendor.wallet_address}
              initialFollowing={initialFollowing}
              initialFollowersCount={followersCount}
              onFollowersChange={setFollowersCount}
            />
            {isOwner && (
              <Link
                href="/dashboard"
                className="rounded-full bg-live-red px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                Go Live
              </Link>
            )}
          </div>
        </div>

        {(vendor.bio || vendor.shop_description) && (
          <div className="mt-5 space-y-2">
            {vendor.bio && (
              <p className="text-sm text-zinc-300">{vendor.bio}</p>
            )}
            {vendor.shop_description && (
              <p className="text-sm text-muted">{vendor.shop_description}</p>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total sales" value={String(stats.total_sales)} />
          <StatCard label="Volume" value={formatSol(stats.total_volume)} />
          <StatCard label="Followers" value={String(followersCount)} />
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted">Rating</p>
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={stats.average_rating} size="md" />
              <span className="text-sm font-semibold text-white">
                {stats.average_rating > 0
                  ? stats.average_rating.toFixed(1)
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {(vendor.twitter_url || vendor.instagram_url) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {vendor.twitter_url && (
              <SocialLink href={vendor.twitter_url} label="Twitter" />
            )}
            {vendor.instagram_url && (
              <SocialLink href={vendor.instagram_url} label="Instagram" />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  const url = href.startsWith("http") ? href : `https://${href}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-border bg-background px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
    >
      {label}
    </a>
  );
}
