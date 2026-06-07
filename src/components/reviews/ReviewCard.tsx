"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { ReviewTagDisplay } from "@/components/reviews/ReviewTagPills";
import StarRating from "@/components/shop/StarRating";
import UserAvatar from "@/components/ui/UserAvatar";
import { useToast } from "@/components/ui/Toast";
import type { Review } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { shortenAddress } from "@/lib/format";
import { getProfileHref } from "@/lib/profile-links";
import { flagReview, replyToReview } from "@/lib/reviews";

export interface ReviewCardData extends Review {
  reviewer_username?: string | null;
  reviewer_avatar?: string | null;
}

export default function ReviewCard({
  review: initialReview,
  vendorWallet,
  onUpdated,
}: {
  review: ReviewCardData;
  vendorWallet: string;
  onUpdated?: (review: Review) => void;
}) {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [review, setReview] = useState(initialReview);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const isVendor =
    publicKey?.toBase58() === vendorWallet && vendorWallet.length > 0;
  const reviewerName = review.reviewer_username
    ? `@${review.reviewer_username.replace(/^@+/, "")}`
    : shortenAddress(review.reviewer_wallet, 6);

  const handleReply = async () => {
    if (!publicKey) return;
    setSubmitting(true);
    try {
      const updated = await replyToReview(
        review.id,
        vendorWallet,
        replyText
      );
      setReview((current) => ({ ...current, ...updated }));
      setShowReplyForm(false);
      setReplyText("");
      showToast("Reply posted.");
      onUpdated?.(updated);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async () => {
    if (review.is_flagged || flagging) return;
    setFlagging(true);
    try {
      const updated = await flagReview(review.id);
      setReview((current) => ({ ...current, ...updated }));
      showToast("Review flagged for moderation.");
      onUpdated?.(updated);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setFlagging(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border p-5 ${
        review.is_flagged
          ? "border-border/60 bg-background/30 opacity-70"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <Link
          href={getProfileHref(
            review.reviewer_username ?? null,
            review.reviewer_wallet
          )}
          className="shrink-0"
        >
          <UserAvatar
            walletAddress={review.reviewer_wallet}
            avatarUrl={review.reviewer_avatar ?? null}
            alt={reviewerName}
            size="sm"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={getProfileHref(
                  review.reviewer_username ?? null,
                  review.reviewer_wallet
                )}
                className="text-sm font-semibold text-white transition-colors hover:text-accent"
              >
                {reviewerName}
              </Link>
              <StarRating rating={review.rating} />
              {review.is_flagged && (
                <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Under review
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleFlag}
              disabled={review.is_flagged || flagging}
              className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface-elevated hover:text-live-red disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Flag review"
              title="Flag review"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
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
              <p className="mt-1 text-sm text-zinc-300">{review.seller_reply}</p>
              {review.seller_reply_at && (
                <p className="mt-1 text-xs text-muted">
                  {new Date(review.seller_reply_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {isVendor && !review.seller_reply && (
            <div className="mt-3">
              {!showReplyForm ? (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(true)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
                >
                  Reply
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(event) =>
                      setReplyText(event.target.value.slice(0, 500))
                    }
                    rows={3}
                    placeholder="Write a reply..."
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReply}
                      disabled={submitting || !replyText.trim()}
                      className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
                    >
                      {submitting ? "Posting..." : "Post Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
