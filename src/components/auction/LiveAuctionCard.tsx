"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  AUCTION_CARD_MIN_WIDTH,
  AuctionCardBidPrice,
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
    <article
      className="flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50"
      style={{ minWidth: AUCTION_CARD_MIN_WIDTH }}
    >
      <Link
        href={`/auction/${auction.id}`}
        className="flex w-full min-w-0 flex-1 flex-col overflow-hidden"
      >
        <div className="relative aspect-[4/3] h-auto w-full overflow-hidden bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={auction.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center"
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
                auction={{
                  id: auction.id,
                  current_bid: auction.current_bid,
                  start_price: auction.start_price,
                  end_time: auction.end_time,
                  created_at: auction.created_at,
                  category: auction.category,
                  item_details: auction.item_details,
                  status: auction.status,
                  is_featured: auction.is_featured,
                }}
                bidCount={bidCount}
                bidCount24h={bidCount24h}
                isTopFeaturedByBids={isTopFeaturedByBids}
                className="mt-2"
              />
            </>
          }
          footer={
            <div className="flex items-end justify-between gap-2">
              <div className="shrink-0">
                <p className="whitespace-nowrap text-xs text-muted">Current bid</p>
                <AuctionCardBidPrice amount={displayBid} />
                <FiatValue solAmount={displayBid} />
              </div>
              <div className="shrink-0 text-right">
                <p className="whitespace-nowrap text-xs text-muted">Time left</p>
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
