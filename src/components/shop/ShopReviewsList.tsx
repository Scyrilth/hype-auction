"use client";

import { useEffect } from "react";

import ReviewCard from "@/components/reviews/ReviewCard";
import type { ReviewWithReviewer } from "@/lib/database.types";

export default function ShopReviewsList({
  reviews,
  vendorWallet,
}: {
  reviews: ReviewWithReviewer[];
  vendorWallet: string;
}) {
  useEffect(() => {
    console.log("[ShopReviewsList]", {
      vendorWallet,
      reviewCount: reviews.length,
      reviews,
    });
  }, [vendorWallet, reviews]);

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
        <ReviewCard
          key={review.id}
          review={review}
          vendorWallet={vendorWallet}
        />
      ))}
    </div>
  );
}
