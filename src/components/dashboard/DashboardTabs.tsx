"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import PastAuctionShipping from "@/components/dashboard/PastAuctionShipping";
import MessageThreadButton from "@/components/messages/MessageThreadButton";
import ReviewCard from "@/components/reviews/ReviewCard";
import FiatValue from "@/components/ui/FiatValue";
import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { useToast } from "@/components/ui/Toast";
import type {
  DashboardActivityItem,
  SellerAuctionWithStats,
  SellerBidRow,
} from "@/lib/dashboard";
import { endSellerAuction } from "@/lib/dashboard";
import type { ReviewWithReviewer } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol, shortenAddress } from "@/lib/format";

type TabId = "active" | "past" | "bids" | "reviews";

const tabs: { id: TabId; label: string }[] = [
  { id: "active", label: "Active Auctions" },
  { id: "past", label: "Past Auctions" },
  { id: "bids", label: "Bids Received" },
  { id: "reviews", label: "Reviews" },
];

function ActiveAuctionCard({
  auction,
  onEnded,
}: {
  auction: SellerAuctionWithStats;
  onEnded: () => void;
}) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [ending, setEnding] = useState(false);

  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);

  const handleEnd = async (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!publicKey || ending) return;
    setEnding(true);
    try {
      await endSellerAuction(auction.id, publicKey.toBase58());
      showToast("Auction ended.");
      onEnded();
    } catch (error) {
      logSupabaseError("ActiveAuctionCard", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setEnding(false);
    }
  };

  const handleViewItem = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    router.push(`/auction/${auction.id}`);
  };

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50">
      <Link
        href={`/auction/${auction.id}`}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label={`View ${auction.title}`}
      />
      <div className="relative z-10 flex flex-1 flex-col pointer-events-none">
        <div className="relative aspect-[16/10] bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={auction.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <AuctionCardContent
          header={
            <>
              <AuctionCardTitle>{auction.title}</AuctionCardTitle>
              <AuctionLabelBadges
                auction={auction}
                bidCount={auction.bidCount}
                className="mt-2"
              />
              {auction.reference_number && (
                <div className="mt-2">
                  <ReferenceNumber referenceNumber={auction.reference_number} />
                </div>
              )}
            </>
          }
          footer={
            <>
              <div className="pointer-events-auto flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Current bid</p>
                  <p className="text-lg font-bold text-accent">
                    {formatSol(displayBid)}
                  </p>
                  <FiatValue solAmount={displayBid} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Time left</p>
                  <CountdownTimer endTime={auction.end_time} compact />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
              </p>
            </>
          }
        />
        <div className="pointer-events-auto px-4 pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleViewItem}
              className="flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white"
            >
              View Item
            </button>
            <button
              type="button"
              onClick={handleEnd}
              disabled={ending}
              className="flex-1 rounded-full bg-surface-elevated py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-accent/20 hover:text-white disabled:opacity-60"
            >
              {ending ? "Ending..." : "End Auction"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PastAuctionCard({ auction }: { auction: SellerAuctionWithStats }) {
  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative aspect-[16/10] bg-surface-elevated opacity-90">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <AuctionCardContent
        header={
          <>
            <AuctionCardTitle>{auction.title}</AuctionCardTitle>
            <AuctionLabelBadges
              auction={auction}
              bidCount={auction.bidCount}
              className="mt-2"
            />
            {auction.reference_number && (
              <div className="mt-2">
                <ReferenceNumber referenceNumber={auction.reference_number} />
              </div>
            )}
          </>
        }
        footer={
          <>
            <div>
              <p className="text-xs text-muted">Final bid</p>
              <p className="text-lg font-bold text-accent">
                {formatSol(displayBid)}
              </p>
              <FiatValue solAmount={displayBid} />
            </div>
            <p className="mt-2 text-xs text-muted">
              Winner:{" "}
              {auction.winnerWallet
                ? shortenAddress(auction.winnerWallet, 6)
                : "No bids"}
            </p>
            {auction.winnerWallet && (
              <div className="mt-3">
                <MessageThreadButton
                  variant="buyer"
                  auctionId={auction.id}
                  auctionTitle={auction.title}
                  sellerWallet={auction.seller_wallet}
                  buyerWallet={auction.winnerWallet}
                  className="w-full rounded-full border border-border py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
                />
              </div>
            )}
            {auction.winnerWallet && (
              <PastAuctionShipping auction={auction} />
            )}
          </>
        }
      />
    </article>
  );
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardTabs({
  activeAuctions,
  pastAuctions,
  bidsReceived,
  reviews,
  vendorWallet,
  onRefresh,
}: {
  activeAuctions: SellerAuctionWithStats[];
  pastAuctions: SellerAuctionWithStats[];
  bidsReceived: SellerBidRow[];
  reviews: ReviewWithReviewer[];
  vendorWallet: string;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("active");

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-white"
                : "text-zinc-400 hover:bg-surface-elevated hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "active" && (
          activeAuctions.length === 0 ? (
            <EmptyTab message="No active auctions. Create a new listing to get started." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeAuctions.map((auction) => (
                <ActiveAuctionCard
                  key={auction.id}
                  auction={auction}
                  onEnded={onRefresh}
                />
              ))}
            </div>
          )
        )}

        {activeTab === "past" && (
          pastAuctions.length === 0 ? (
            <EmptyTab message="No past auctions yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastAuctions.map((auction) => (
                <PastAuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )
        )}

        {activeTab === "bids" && (
          bidsReceived.length === 0 ? (
            <EmptyTab message="No bids received yet." />
          ) : (
            <div className="space-y-2">
              {bidsReceived.map((bid) => (
                <div
                  key={bid.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {bid.auctionTitle}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {shortenAddress(bid.bidderWallet, 6)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <p className="text-sm font-bold text-accent">
                      {formatSol(bid.amount)}
                    </p>
                    <p className="text-xs text-muted">
                      {formatRelativeTime(bid.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "reviews" && (
          reviews.length === 0 ? (
            <EmptyTab message="No reviews yet." />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  vendorWallet={vendorWallet}
                  onUpdated={onRefresh}
                />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted">
      {message}
    </div>
  );
}

export function DashboardActivityFeed({
  activity,
}: {
  activity: DashboardActivityItem[];
}) {
  if (activity.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <p className="mt-4 text-sm text-muted">No recent activity yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
      <div className="mt-4 space-y-3">
        {activity.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <ActivityIcon type={item.type} />
            <div className="min-w-0 flex-1">
              {item.type === "bid" && (
                <>
                  <p className="text-sm text-zinc-300">
                    <span className="font-mono text-purple-300">
                      {shortenAddress(item.bidderWallet, 4)}
                    </span>{" "}
                    bid {formatSol(item.amount)} on{" "}
                    <span className="font-medium text-white">
                      {item.auctionTitle}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </>
              )}
              {item.type === "follow" && (
                <>
                  <p className="text-sm text-zinc-300">
                    New follower{" "}
                    <span className="font-mono text-purple-300">
                      {shortenAddress(item.followerWallet, 4)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </>
              )}
              {item.type === "review" && (
                <>
                  <p className="text-sm text-zinc-300">
                    New {item.rating}-star review from{" "}
                    <span className="font-mono text-purple-300">
                      {shortenAddress(item.reviewerWallet, 4)}
                    </span>
                  </p>
                  {item.comment && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      &ldquo;{item.comment}&rdquo;
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityIcon({ type }: { type: DashboardActivityItem["type"] }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold";

  if (type === "bid") {
    return (
      <span className={`${base} bg-accent/20 text-accent`}>$</span>
    );
  }
  if (type === "follow") {
    return (
      <span className={`${base} bg-purple-500/20 text-purple-300`}>+</span>
    );
  }
  return (
    <span className={`${base} bg-amber-500/20 text-amber-400`}>★</span>
  );
}
