"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import CountdownTimer from "@/components/auction/CountdownTimer";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import type { Auction } from "@/lib/database.types";
import { placeBid } from "@/lib/bids";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { formatSol, formatUsdSol, shortenAddress } from "@/lib/format";

interface BidPanelProps {
  auction: Auction;
  bidCount: number;
  topBidder: string | null;
}

export default function BidPanel({
  auction,
  bidCount: initialBidCount,
  topBidder: initialTopBidder,
}: BidPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const connectPhantom = usePhantomConnect();
  const { publicKey, connected } = useWallet();

  const [bidCount, setBidCount] = useState(initialBidCount);
  const [topBidder, setTopBidder] = useState(initialTopBidder);
  const [currentBid, setCurrentBid] = useState(
    auction.current_bid > 0 ? auction.current_bid : auction.start_price
  );
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  useEffect(() => {
    setBidCount(initialBidCount);
    setTopBidder(initialTopBidder);
    setCurrentBid(
      auction.current_bid > 0 ? auction.current_bid : auction.start_price
    );
  }, [initialBidCount, initialTopBidder, auction.current_bid, auction.start_price]);

  const nextBid = Math.round((currentBid + 0.1) * 100) / 100;

  // Database-only bid — wallet is used for identity, not SOL transfers.
  const handlePlaceBid = async (amount: number) => {
    if (!connected || !publicKey) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click Place Bid again.");
      } catch {
        showToast("Connect your wallet to place a bid.", "error");
      }
      return;
    }

    setIsPlacingBid(true);

    try {
      const walletAddress = publicKey.toBase58();

      await placeBid({
        auctionId: auction.id,
        bidderWallet: walletAddress,
        amount,
      });

      setCurrentBid(amount);
      setBidCount((c) => c + 1);
      setTopBidder(walletAddress);
      showToast("Bid placed successfully!");
      router.refresh();
    } catch (error) {
      logSupabaseError("BidPanel: handlePlaceBid", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <div className="flex w-64 shrink-0 flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Current Bid
        </p>
        <p className="mt-1 text-3xl font-bold text-white">
          {formatSol(currentBid)}
        </p>
        <p className="text-sm text-muted">{formatUsdSol(currentBid)}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Time Left
        </p>
        <div className="mt-1">
          <CountdownTimer endTime={auction.end_time} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted">
            {bidCount} {bidCount === 1 ? "Bid" : "Bids"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Top Bidder</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <span className="font-mono text-xs text-zinc-300">
              {topBidder ? shortenAddress(topBidder) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          disabled={isPlacingBid}
          onClick={() => handlePlaceBid(nextBid)}
          className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPlacingBid ? "Placing bid..." : `Place Bid ${formatSol(nextBid)}`}
        </button>
        <button
          type="button"
          disabled={isPlacingBid}
          onClick={() => handlePlaceBid(nextBid)}
          className="w-full rounded-full border border-border py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Quick Bid +0.10 SOL
        </button>
      </div>
    </div>
  );
}
