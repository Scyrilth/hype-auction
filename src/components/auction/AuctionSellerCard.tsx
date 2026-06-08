import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import type { User } from "@/lib/database.types";
import { displaySocialHandle } from "@/lib/format";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
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

export default function AuctionSellerCard({
  seller,
  reviewCount = 0,
}: {
  seller: User;
  reviewCount?: number;
}) {
  const walletAddress = seller.wallet_address?.trim() || "unknown";
  const displayName =
    seller.shop_name?.trim() ||
    seller.username?.replace(/^@+/, "").trim() ||
    "Unknown Seller";
  const shopSlug =
    seller.username?.replace(/^@+/, "").trim() || walletAddress;
  const shopHref = `/shop/${shopSlug}`;

  return (
    <Link
      href={shopHref}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Seller
      </p>

      <div className="mt-3 flex items-center gap-3">
        <UserAvatar
          walletAddress={walletAddress}
          avatarUrl={seller.avatar_url}
          alt={displayName}
          size="md"
          rounded="xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            {seller.is_verified && <VerifiedBadge />}
          </div>
          {seller.username && (
            <p className="text-xs text-muted">
              {displaySocialHandle(seller.username)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-background/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Sales
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {seller.total_sales ?? 0}
          </p>
        </div>
        <div className="rounded-lg bg-background/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Rating
          </p>
          <div className="mt-0.5 flex flex-col items-center gap-0.5">
            <StarRating rating={seller.average_rating ?? 0} size="sm" />
            {reviewCount > 0 && (
              <p className="text-[10px] text-muted">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg bg-background/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Followers
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {seller.followers_count ?? 0}
          </p>
        </div>
      </div>
    </Link>
  );
}
