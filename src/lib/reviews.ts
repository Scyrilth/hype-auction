import type { Auction, Review, ReviewWithReviewer } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function parseReviewRow(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    vendor_wallet: row.vendor_wallet as string,
    reviewer_wallet: row.reviewer_wallet as string,
    auction_id: (row.auction_id as string | null) ?? null,
    rating: Number(row.rating),
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : null,
    seller_reply: (row.seller_reply as string | null) ?? null,
    seller_reply_at: (row.seller_reply_at as string | null) ?? null,
    is_flagged: Boolean(row.is_flagged),
    is_dummy: Boolean(row.is_dummy),
  };
}

export function isReviewEligible(auction: Auction): boolean {
  return auction.status === "ended" || auction.status === "completed";
}

export async function getReviewedAuctionIds(
  reviewerWallet: string,
  auctionIds: string[]
): Promise<Set<string>> {
  if (!auctionIds.length) return new Set();

  const { data, error } = await supabase
    .from("reviews")
    .select("auction_id")
    .eq("reviewer_wallet", reviewerWallet)
    .in("auction_id", auctionIds);

  if (error) throw error;

  return new Set(
    (data ?? [])
      .map((row) => row.auction_id as string | null)
      .filter((id): id is string => Boolean(id))
  );
}

export async function getVendorReviews(
  vendorWallet: string
): Promise<ReviewWithReviewer[]> {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("vendor_wallet", vendorWallet)
    .or("is_flagged.eq.false,is_flagged.is.null")
    .order("created_at", { ascending: false });

  console.log("[getVendorReviews] raw response", {
    vendorWallet,
    rowCount: reviews?.length ?? 0,
    data: reviews,
    error,
  });

  if (error) throw error;
  if (!reviews?.length) return [];

  const reviewerWallets = [
    ...new Set(reviews.map((row) => row.reviewer_wallet as string)),
  ];

  const { data: reviewers, error: reviewersError } = await supabase
    .from("users")
    .select("wallet_address, username, avatar_url")
    .in("wallet_address", reviewerWallets);

  if (reviewersError) throw reviewersError;

  const reviewerMap = new Map(
    (reviewers ?? []).map((user) => [user.wallet_address as string, user])
  );

  return reviews.map((row) => {
    const reviewer = reviewerMap.get(row.reviewer_wallet as string);
    const review = parseReviewRow(row as Record<string, unknown>);

    return {
      ...review,
      reviewer_username: (reviewer?.username as string | null) ?? null,
      reviewer_avatar: (reviewer?.avatar_url as string | null) ?? null,
    };
  });
}

export async function getVendorReviewCount(vendorWallet: string): Promise<number> {
  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("vendor_wallet", vendorWallet)
    .eq("is_flagged", false);

  if (error) throw error;
  return count ?? 0;
}

export async function refreshVendorRating(vendorWallet: string): Promise<void> {
  const { error } = await supabase.rpc("refresh_vendor_stats", {
    p_wallet: vendorWallet,
  });

  if (error) throw error;
}

export interface SubmitReviewInput {
  reviewerWallet: string;
  vendorWallet: string;
  auctionId: string;
  rating: number;
  comment?: string;
  tags: string[];
}

export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  const comment = input.comment?.trim() || null;

  if (comment && comment.length > 500) {
    throw new Error("Review comment must be 500 characters or less.");
  }

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_wallet: input.reviewerWallet,
      vendor_wallet: input.vendorWallet,
      auction_id: input.auctionId,
      rating: input.rating,
      comment,
      tags: input.tags.length > 0 ? input.tags : null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already reviewed this auction.");
    }
    throw error;
  }

  await refreshVendorRating(input.vendorWallet);
  return parseReviewRow(data as Record<string, unknown>);
}

export async function replyToReview(
  reviewId: string,
  vendorWallet: string,
  reply: string
): Promise<Review> {
  const trimmed = reply.trim();
  if (!trimmed) throw new Error("Reply cannot be empty.");
  if (trimmed.length > 500) throw new Error("Reply must be 500 characters or less.");

  const { data, error } = await supabase
    .from("reviews")
    .update({
      seller_reply: trimmed,
      seller_reply_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("vendor_wallet", vendorWallet)
    .select("*")
    .single();

  if (error) throw error;
  return parseReviewRow(data as Record<string, unknown>);
}

export async function flagReview(reviewId: string): Promise<Review> {
  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (fetchError) throw fetchError;

  const existingReview = parseReviewRow(existing as Record<string, unknown>);
  if (existingReview.is_flagged) return existingReview;

  const { data, error } = await supabase
    .from("reviews")
    .update({ is_flagged: true })
    .eq("id", reviewId)
    .select("*")
    .single();

  if (error) throw error;

  await refreshVendorRating(existingReview.vendor_wallet);
  return parseReviewRow(data as Record<string, unknown>);
}

export function averageRatingFromReviews(
  reviews: Pick<Review, "rating" | "is_flagged">[]
): number {
  const active = reviews.filter((review) => !review.is_flagged);
  if (active.length === 0) return 0;
  const sum = active.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / active.length) * 10) / 10;
}
