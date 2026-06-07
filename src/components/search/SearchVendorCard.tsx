import Image from "next/image";
import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import type { VendorSearchHit } from "@/lib/search";

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

export default function SearchVendorCard({ vendor }: { vendor: VendorSearchHit }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50">
      <div className="relative h-28 bg-surface-elevated sm:h-32">
        {vendor.bannerImage ? (
          <Image
            src={vendor.bannerImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/50 via-purple-900/80 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

        {vendor.isLive && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-0">
        <div className="-mt-8 flex items-end gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-4 border-surface bg-surface-elevated">
            {vendor.avatarUrl ? (
              <Image
                src={vendor.avatarUrl}
                alt={vendor.shopName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent/20 text-sm font-bold text-accent">
                {vendor.shopName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">
                {vendor.shopName}
              </h3>
              {vendor.isVerified && <VerifiedBadge />}
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
              {vendor.followersCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Sales</p>
            <p className="text-sm font-semibold text-white">
              {vendor.totalSales}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Rating</p>
            <div className="mt-0.5 flex justify-center">
              {vendor.averageRating > 0 ? (
                <StarRating rating={vendor.averageRating} />
              ) : (
                <span className="text-sm text-muted">—</span>
              )}
            </div>
          </div>
        </div>

        {vendor.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vendor.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-purple-300"
              >
                {category}
              </span>
            ))}
            {vendor.categories.length > 3 && (
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-muted">
                +{vendor.categories.length - 3}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/shop/${vendor.shopSlug}`}
          className="mt-4 block w-full rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Visit Shop
        </Link>
      </div>
    </article>
  );
}
