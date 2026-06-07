"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import AuctionSellerCard from "@/components/auction/AuctionSellerCard";
import CountdownTimer from "@/components/auction/CountdownTimer";
import LiveChat from "@/components/auction/LiveChat";
import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { placeBid } from "@/lib/bids";
import type { Auction, User } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { formatSol, shortenAddress } from "@/lib/format";

function getMinimumBid(auction: Auction) {
  const floor = Math.max(auction.current_bid, auction.start_price);
  return Math.round((floor + 0.1) * 100) / 100;
}

export default function AuctionBidSidebar({
  auction,
  seller,
  bidCount: initialBidCount,
  topBidder: initialTopBidder,
  topBidderUsername: initialTopBidderUsername,
}: {
  auction: Auction;
  seller: User;
  bidCount: number;
  topBidder: string | null;
  topBidderUsername: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const connectPhantom = usePhantomConnect();
  const { publicKey, connected } = useWallet();

  const [bidCount, setBidCount] = useState(initialBidCount);
  const [topBidder, setTopBidder] = useState(initialTopBidder);
  const [topBidderUsername, setTopBidderUsername] = useState(
    initialTopBidderUsername
  );
  const [currentBid, setCurrentBid] = useState(
    auction.current_bid > 0 ? auction.current_bid : auction.start_price
  );
  const [bidInput, setBidInput] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const minimumBid = useMemo(
    () => getMinimumBid({ ...auction, current_bid: currentBid }),
    [auction, currentBid]
  );

  const isLive =
    auction.status === "live" &&
    new Date(auction.end_time).getTime() > Date.now();

  useEffect(() => {
    setBidCount(initialBidCount);
    setTopBidder(initialTopBidder);
    setTopBidderUsername(initialTopBidderUsername);
    setCurrentBid(
      auction.current_bid > 0 ? auction.current_bid : auction.start_price
    );
  }, [
    initialBidCount,
    initialTopBidder,
    initialTopBidderUsername,
    auction.current_bid,
    auction.start_price,
  ]);

  useEffect(() => {
    if (!bidInput) {
      setBidInput(minimumBid.toFixed(2));
    }
  }, [minimumBid, bidInput]);

  const topBidderLabel = topBidderUsername
    ? `@${topBidderUsername.replace(/^@+/, "")}`
    : topBidder
      ? shortenAddress(topBidder, 4)
      : "—";

  const handlePlaceBid = async (amount: number) => {
    if (!isLive) {
      showToast("This auction is no longer live.", "error");
      return;
    }

    if (!connected || !publicKey) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click Place Bid again.");
      } catch {
        showToast("Connect your wallet to place a bid.", "error");
      }
      return;
    }

    const floor = Math.max(currentBid, auction.start_price);
    if (amount <= floor) {
      showToast("Bid must be higher than the current bid.", "error");
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
      setBidCount((count) => count + 1);
      setTopBidder(walletAddress);
      setTopBidderUsername(null);
      setBidInput((Math.round((amount + 0.1) * 100) / 100).toFixed(2));
      showToast("Bid placed successfully!");
      router.refresh();
    } catch (error) {
      logSupabaseError("AuctionBidSidebar", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsPlacingBid(false);
    }
  };

  const floor = Math.max(currentBid, auction.start_price);
  const quickBids = [
    { label: "+0.1 SOL", amount: Math.round((floor + 0.1) * 100) / 100 },
    { label: "+0.5 SOL", amount: Math.round((floor + 0.5) * 100) / 100 },
    { label: "+1 SOL", amount: Math.round((floor + 1) * 100) / 100 },
  ];

  return (
    <div className="space-y-4 lg:sticky lg:top-5">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Time Left
        </p>
        <div className="mt-2">
          <CountdownTimer endTime={auction.end_time} large />
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Current Bid
          </p>
          <p className="mt-1 text-3xl font-bold text-white">
            {formatSol(currentBid)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-background/60 px-3 py-3">
          <p className="text-xs text-muted">Top bidder</p>
          <p className="mt-1 text-sm font-medium text-white">
            {topBidderLabel}
          </p>
        </div>

        {isLive ? (
          <div className="mt-5 space-y-3">
            <div>
              <label
                htmlFor="bid-amount"
                className="text-xs font-medium uppercase tracking-wider text-muted"
              >
                Your bid (SOL)
              </label>
              <input
                id="bid-amount"
                type="number"
                min={minimumBid}
                step="0.01"
                value={bidInput}
                onChange={(event) => setBidInput(event.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
              />
              <p className="mt-1 text-xs text-muted">
                Minimum {formatSol(minimumBid)}
              </p>
            </div>

            <button
              type="button"
              disabled={isPlacingBid}
              onClick={() => handlePlaceBid(parseFloat(bidInput))}
              className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingBid ? "Placing bid..." : "Place Bid"}
            </button>

            <div className="grid grid-cols-3 gap-2">
              {quickBids.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  disabled={isPlacingBid}
                  onClick={() => {
                    setBidInput(quick.amount.toFixed(2));
                    handlePlaceBid(quick.amount);
                  }}
                  className="rounded-full border border-border py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-accent/50 hover:text-white disabled:opacity-60"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-background/60 px-3 py-3 text-sm text-muted">
            This auction has ended.
          </p>
        )}
      </div>

      <AuctionSellerCard seller={seller} />

      <div className="min-h-[20rem]">
        <LiveChat auctionId={auction.id} />
      </div>
    </div>
  );
}
