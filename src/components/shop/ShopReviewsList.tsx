import Link from "next/link";

import StarRating from "@/components/shop/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import type { ReviewWithReviewer } from "@/lib/database.types";
import { shortenAddress } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";

export default function ShopReviewsList({
  reviews,
}: {
  reviews: ReviewWithReviewer[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-start gap-3">
            <Link
              href={getProfileHref(
                review.reviewer_username,
                review.reviewer_wallet
              )}
              className="shrink-0"
            >
              <UserAvatar
                walletAddress={review.reviewer_wallet}
                avatarUrl={review.reviewer_avatar}
                alt={
                  review.reviewer_username ??
                  shortenAddress(review.reviewer_wallet)
                }
                size="sm"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={getProfileHref(
                    review.reviewer_username,
                    review.reviewer_wallet
                  )}
                  className="text-sm font-semibold text-white transition-colors hover:text-accent"
                >
                  {review.reviewer_username
                    ? `@${review.reviewer_username.replace(/^@+/, "")}`
                    : shortenAddress(review.reviewer_wallet)}
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
      ))}
    </div>
  );
}
