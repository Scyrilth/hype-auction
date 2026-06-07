import Image from "next/image";
import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import type { VendorDirectoryEntry } from "@/lib/vendors";
import { shortenAddress } from "@/lib/format";

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-300"
      title="Verified vendor"
    >
      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
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

export default function VendorCard({ entry }: { entry: VendorDirectoryEntry }) {
  const { vendor, averageRating, totalSales, categories, isLive, shopSlug } =
    entry;

  const displayName =
    vendor.shop_name ?? vendor.username ?? shortenAddress(vendor.wallet_address);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50">
      <div className="relative h-28 bg-surface-elevated sm:h-32">
        {vendor.banner_image ? (
          <Image
            src={vendor.banner_image}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/50 via-purple-900/80 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

        {isLive && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-0">
        <div className="-mt-8 flex items-end gap-3">
          <UserAvatar
            walletAddress={vendor.wallet_address}
            avatarUrl={vendor.avatar_url}
            alt={displayName}
            size="lg"
            rounded="xl"
            className="border-4 border-surface"
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">
                {displayName}
              </h3>
              {vendor.is_verified && <VerifiedBadge />}
            </div>
            {vendor.username && (
              <p className="truncate text-xs text-muted">@{vendor.username}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted">Followers</p>
            <p className="text-sm font-semibold text-white">
              {vendor.followers_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Sales</p>
            <p className="text-sm font-semibold text-white">{totalSales}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Rating</p>
            <div className="mt-0.5 flex justify-center">
              {averageRating > 0 ? (
                <StarRating rating={averageRating} />
              ) : (
                <span className="text-sm text-muted">—</span>
              )}
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-purple-300"
              >
                {category}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-muted">
                +{categories.length - 3}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/shop/${shopSlug}`}
          className="mt-4 block w-full rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Visit Shop
        </Link>
      </div>
    </article>
  );
}
