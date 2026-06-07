import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import type { ReviewWithVendor } from "@/lib/profile";
import { getShopOrProfileHref } from "@/lib/profile-links";
import { shortenAddress } from "@/lib/format";

export default function ProfileReviewsGivenList({
  reviews,
}: {
  reviews: ReviewWithVendor[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">No reviews given yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const vendorName =
          review.vendor_shop_name ??
          review.vendor_username ??
          shortenAddress(review.vendor_wallet, 6);
        const vendorHref = getShopOrProfileHref({
          username: review.vendor_username,
          wallet_address: review.vendor_wallet,
          is_vendor: review.vendor_is_vendor,
        });

        return (
          <article
            key={review.id}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-start gap-3">
              <Link href={vendorHref} className="shrink-0">
                <UserAvatar
                  walletAddress={review.vendor_wallet}
                  avatarUrl={review.vendor_avatar}
                  alt={vendorName}
                  size="sm"
                  rounded="xl"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={vendorHref}
                    className="text-sm font-semibold text-white transition-colors hover:text-accent"
                  >
                    {vendorName}
                  </Link>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {review.comment}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
