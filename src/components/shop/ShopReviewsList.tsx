import Image from "next/image";

import StarRating from "@/components/shop/StarRating";
import type { ReviewWithReviewer } from "@/lib/database.types";
import { shortenAddress } from "@/lib/format";

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
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
              {review.reviewer_avatar ? (
                <Image
                  src={review.reviewer_avatar}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-accent">
                  {(review.reviewer_username ?? review.reviewer_wallet).slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {review.reviewer_username ??
                    shortenAddress(review.reviewer_wallet)}
                </p>
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
