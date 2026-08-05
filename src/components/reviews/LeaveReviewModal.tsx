"use client";

import { useState } from "react";

import StarRatingInput from "@/components/reviews/StarRatingInput";
import { ReviewTagSelector } from "@/components/reviews/ReviewTagPills";
import { useToast } from "@/components/ui/Toast";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage } from "@/lib/errors";
import { submitReview } from "@/lib/reviews";

export default function LeaveReviewModal({
  auction,
  vendorWallet,
  reviewerWallet,
  open,
  onClose,
  onSubmitted,
}: {
  auction: Auction;
  vendorWallet: string;
  reviewerWallet: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { client } = useSupabaseClient();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (rating < 1) {
      showToast("Please select a star rating.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        reviewerWallet,
        vendorWallet,
        auctionId: auction.id,
        rating,
        comment,
        tags,
      }, client);
      showToast("Review submitted successfully!");
      onSubmitted();
      onClose();
      setRating(0);
      setComment("");
      setTags([]);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close review modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white">Leave a Review</h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{auction.title}</p>

        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Rating <span className="text-live-red">*</span>
            </p>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Comment (optional)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, 500))}
              rows={4}
              placeholder="Share your experience with this seller..."
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
            />
            <p className="mt-1 text-right text-xs text-muted">
              {comment.length}/500
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Quick tags
            </p>
            <ReviewTagSelector selected={tags} onChange={setTags} />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-full border border-border py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
