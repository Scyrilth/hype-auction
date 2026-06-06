"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import CountdownTimer from "@/components/auction/CountdownTimer";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { placeBid } from "@/lib/bids";
import type { Auction } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import { formatSol } from "@/lib/format";

function LiveAuctionCard({ auction }: { auction: Auction }) {
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
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-accent/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
          unoptimized
        />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-live-red px-2 py-0.5 text-xs font-bold uppercase text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">
          {auction.title}
        </h3>

        {auction.category && (
          <span className="mt-2 inline-block w-fit rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-purple-300">
            {auction.category}
          </span>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted">Current bid</p>
            <p className="text-lg font-bold text-accent">
              {formatSol(displayBid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Time left</p>
            <CountdownTimer endTime={auction.end_time} compact />
          </div>
        </div>

        <button
          type="button"
          disabled={isPlacingBid}
          onClick={handleBidNow}
          className="mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlacingBid ? "Bidding..." : "Bid Now"}
        </button>
      </div>
    </article>
  );
}

export default function LiveAuctionsGrid({
  auctions,
}: {
  auctions: Auction[];
}) {
  if (auctions.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-base font-semibold text-white">Live Auctions</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] sm:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))]">
        {auctions.map((auction) => (
          <LiveAuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </section>
  );
}
