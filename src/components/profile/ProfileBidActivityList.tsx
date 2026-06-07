"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import CountdownTimer from "@/components/auction/CountdownTimer";
import WonAuctionShipping from "@/components/profile/WonAuctionShipping";
import LeaveReviewModal from "@/components/reviews/LeaveReviewModal";
import FiatValue from "@/components/ui/FiatValue";
import type { BuyerBidActivity, BidActivityStatus } from "@/lib/profile";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";
import { isReviewEligible } from "@/lib/reviews";

function BidStatusBadge({ status }: { status: BidActivityStatus }) {
  switch (status) {
    case "WINNING":
      return (
        <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Winning
        </span>
      );
    case "OUTBID":
      return (
        <span className="rounded-md bg-live-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Outbid
        </span>
      );
    case "WON":
      return (
        <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-900">
          Won 🏆
        </span>
      );
    case "LOST":
    default:
      return (
        <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
          Lost
        </span>
      );
  }
}

function ReviewActionButton({
  item,
  reviewed,
  onLeaveReview,
}: {
  item: BuyerBidActivity;
  reviewed: boolean;
  onLeaveReview: () => void;
}) {
  if (reviewed) {
    return (
      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
        Review Submitted ✓
      </span>
    );
  }

  if (!isReviewEligible(item.auction)) {
    return (
      <span
        className="max-w-[11rem] rounded-full border border-border bg-background/60 px-3 py-1.5 text-center text-[11px] text-muted"
        title="Review available after receipt confirmation"
      >
        Review available after receipt confirmation
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onLeaveReview}
      className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
    >
      Leave Review
    </button>
  );
}

function BidActivityCard({
  item,
  showReviewActions,
  showWonShipping,
  reviewedAuctionIds,
  onReviewSubmitted,
}: {
  item: BuyerBidActivity;
  showReviewActions?: boolean;
  showWonShipping?: boolean;
  reviewedAuctionIds: Set<string>;
  onReviewSubmitted: (auctionId: string) => void;
}) {
  const { publicKey } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const imageSrc = resolveAuctionImageUrl(
    item.auction.image_url,
    item.auction
  );
  const isLive = item.auction.status === "live";
  const reviewed = reviewedAuctionIds.has(item.auction.id);
  const showReview =
    showReviewActions && item.status === "WON" && Boolean(publicKey);
  const isWonAuction =
    item.isWinner &&
    (item.auction.status === "ended" || item.auction.status === "completed");
  const finalBidLabel = isWonAuction ? "Winning bid" : "Current bid";

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex gap-4 p-4">
          <div className="flex min-w-0 flex-1 gap-4">
            <Link
              href={`/auction/${item.auction.id}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-elevated transition-opacity hover:opacity-95 sm:h-24 sm:w-24"
            >
              <Image
                src={imageSrc}
                alt={item.auction.title}
                fill
                className="object-cover"
                unoptimized
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/auction/${item.auction.id}`}
                className="block transition-colors hover:opacity-95"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-white">
                    {item.auction.title}
                  </h3>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <BidStatusBadge status={item.status} />
                      {isLive && (
                        <CountdownTimer endTime={item.auction.end_time} compact />
                      )}
                    </div>
                    {item.status === "OUTBID" && item.outbidBy > 0 && (
                      <p className="text-[11px] font-medium text-live-red">
                        Outbid by {formatSol(item.outbidBy)}
                      </p>
                    )}
                  </div>
                </div>

                {item.auction.category && (
                  <span className="mt-2 inline-block rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                    {item.auction.category}
                  </span>
                )}
              </Link>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Your highest bid</p>
                  <p className="font-semibold text-accent">
                    {formatSol(item.userHighestBid)}
                  </p>
                  <FiatValue solAmount={item.userHighestBid} />
                </div>
                <div>
                  <p className="text-xs text-muted">{finalBidLabel}</p>
                  <p className="font-semibold text-white">
                    {formatSol(item.currentBid)}
                  </p>
                  <FiatValue solAmount={item.currentBid} />
                </div>
              </div>

              {showWonShipping && isWonAuction && (
                <WonAuctionShipping auction={item.auction} />
              )}
            </div>
          </div>

          {showReview && (
            <div className="flex shrink-0 flex-col justify-end">
              <ReviewActionButton
                item={item}
                reviewed={reviewed}
                onLeaveReview={() => setModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {showReview && publicKey && (
        <LeaveReviewModal
          auction={item.auction}
          vendorWallet={item.auction.seller_wallet}
          reviewerWallet={publicKey.toBase58()}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => onReviewSubmitted(item.auction.id)}
        />
      )}
    </>
  );
}

export default function ProfileBidActivityList({
  items,
  emptyMessage,
  showReviewActions = false,
  showWonShipping = false,
  reviewedAuctionIds: initialReviewedIds = [],
}: {
  items: BuyerBidActivity[];
  emptyMessage: string;
  showReviewActions?: boolean;
  showWonShipping?: boolean;
  reviewedAuctionIds?: string[];
}) {
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const reviewedAuctionIds = useMemo(() => {
    const ids = new Set(initialReviewedIds);
    for (const id of submittedIds) ids.add(id);
    return ids;
  }, [initialReviewedIds, submittedIds]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <BidActivityCard
          key={item.auction.id}
          item={item}
          showReviewActions={showReviewActions}
          showWonShipping={showWonShipping}
          reviewedAuctionIds={reviewedAuctionIds}
          onReviewSubmitted={(auctionId) =>
            setSubmittedIds((current) => new Set([...current, auctionId]))
          }
        />
      ))}
    </div>
  );
}
