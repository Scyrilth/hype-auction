"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  AuctionCardCategorySlot,
  AuctionCardContent,
  AuctionCardTitle,
} from "@/components/auction/AuctionCardLayout";
import AuctionLabelBadges from "@/components/auction/AuctionLabelBadges";
import CountdownTimer from "@/components/auction/CountdownTimer";
import WatchlistHeart from "@/components/auction/WatchlistHeart";
import FiatValue from "@/components/ui/FiatValue";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { placeBid } from "@/lib/bids";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

export default function LiveAuctionCard({
  auction,
  bidCount,
  bidCount24h,
  isTopFeaturedByBids,
}: {
  auction: Auction;
  bidCount?: number;
  bidCount24h?: number;
  isTopFeaturedByBids?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const connectPhantom = usePhantomConnect();
  const { publicKey, connected } = useWallet();
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const displayBid =
    auction.current_bid > 0 ? auction.current_bid : auction.start_price;
  const nextBid = Math.round((displayBid + 0.1) * 100) / 100;
  const imageSrc = resolveAuctionImageUrl(auction.image_url, auction);

  const handleBidNow = async () => {
    if (!connected || !publicKey) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click Bid Now again.");
      } catch {
        showToast("Connect your wallet to place a bid.", "error");
      }
      return;
    }

    setIsPlacingBid(true);

    try {
      await placeBid({
        auctionId: auction.id,
        bidderWallet: publicKey.toBase58(),
        amount: nextBid,
      });
      showToast("Bid placed successfully!");
      router.refresh();
    } catch (error) {
      logSupabaseError("LiveAuctionCard", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <article className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50">
      <Link href={`/auction/${auction.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={auction.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            unoptimized
          />
          <WatchlistHeart auctionId={auction.id} />
        </div>

        <AuctionCardContent
          header={
            <>
              <AuctionCardTitle>{auction.title}</AuctionCardTitle>
              <AuctionCardCategorySlot category={auction.category} />
              <AuctionLabelBadges
                auction={auction}
                bidCount={bidCount}
                bidCount24h={bidCount24h}
                isTopFeaturedByBids={isTopFeaturedByBids}
                className="mt-2"
              />
            </>
          }
          footer={
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs text-muted">Current bid</p>
                <p className="text-lg font-bold text-accent">
                  {formatSol(displayBid)}
                </p>
                <FiatValue solAmount={displayBid} showTooltip={false} />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Time left</p>
                <CountdownTimer endTime={auction.end_time} compact />
              </div>
            </div>
          }
        />
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          disabled={isPlacingBid}
          onClick={handleBidNow}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlacingBid ? "Bidding..." : "Bid Now"}
        </button>
      </div>
    </article>
  );
}
