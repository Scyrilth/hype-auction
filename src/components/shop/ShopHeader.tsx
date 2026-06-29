"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import MessageThreadButton from "@/components/messages/MessageThreadButton";
import FollowButton from "@/components/shop/FollowButton";
import StarRating from "@/components/shop/StarRating";
import FiatValue from "@/components/ui/FiatValue";
import UserAvatar from "@/components/ui/UserAvatar";
import SpecialBadges from "@/components/ui/SpecialBadges";
import type { User, VendorShopStats } from "@/lib/database.types";
import { formatSol, displaySocialHandle, shortenAddress } from "@/lib/format";

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
  const { publicKey, connected } = useWallet();
  const [followersCount, setFollowersCount] = useState(stats.followers_count);

  const isOwner =
    publicKey?.toBase58() === vendor.wallet_address;

  const displayName =
    vendor.shop_name ?? vendor.username ?? shortenAddress(vendor.wallet_address);

  const bannerSrc = vendor.banner_image || DEFAULT_BANNER;

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
            <UserAvatar
              walletAddress={vendor.wallet_address}
              avatarUrl={vendor.avatar_url}
              alt={displayName}
              size="3xl"
              rounded="xl"
              className="border-4 border-surface"
            />

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {displayName}
                </h1>
                <SpecialBadges walletAddress={vendor.wallet_address} />
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
            {!isOwner && connected && (
              <MessageThreadButton
                variant="general"
                sellerWallet={vendor.wallet_address}
              />
            )}
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
          <StatCard label="Volume" value={formatSol(stats.total_volume)} fiatSolAmount={stats.total_volume} />
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
            {stats.review_count > 0 && (
              <p className="mt-0.5 text-xs text-muted">
                {stats.review_count}{" "}
                {stats.review_count === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        </div>

        {(vendor.social_twitter || vendor.social_instagram) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {vendor.social_twitter && (
              <SocialHandleLink
                href={`https://x.com/${vendor.social_twitter.replace(/^@+/, "")}`}
                handle={displaySocialHandle(vendor.social_twitter)}
                platform="x"
              />
            )}
            {vendor.social_instagram && (
              <SocialHandleLink
                href={`https://instagram.com/${vendor.social_instagram.replace(/^@+/, "")}`}
                handle={displaySocialHandle(vendor.social_instagram)}
                platform="instagram"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  fiatSolAmount,
}: {
  label: string;
  value: string;
  fiatSolAmount?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {fiatSolAmount !== undefined && (
        <div className="mt-0.5">
          <FiatValue solAmount={fiatSolAmount} />
        </div>
      )}
    </div>
  );
}

function SocialHandleLink({
  href,
  handle,
  platform,
}: {
  href: string;
  handle: string;
  platform: "x" | "instagram";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
    >
      {platform === "x" ? <XIcon /> : <InstagramIcon />}
      <span>{handle}</span>
    </a>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
