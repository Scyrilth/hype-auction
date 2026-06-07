import Link from "next/link";

import { ReviewTagDisplay } from "@/components/reviews/ReviewTagPills";
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
            className={`rounded-2xl border p-5 ${
              review.is_flagged
                ? "border-border/60 bg-background/30 opacity-70"
                : "border-border bg-surface"
            }`}
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
                  {review.is_flagged && (
                    <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Under review
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {review.comment}
                  </p>
                )}
                <ReviewTagDisplay tags={review.tags} />
                <p className="mt-2 text-xs text-muted">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                {review.seller_reply && (
                  <div className="mt-4 ml-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                      Seller reply
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {review.seller_reply}
                    </p>
                    {review.seller_reply_at && (
                      <p className="mt-1 text-xs text-muted">
                        {new Date(review.seller_reply_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
