"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import AuctionSellerCard from "@/components/auction/AuctionSellerCard";
import AuctionShippingInfo from "@/components/auction/AuctionShippingInfo";
import BidAddressPromptModal from "@/components/auction/BidAddressPromptModal";
import CountdownTimer from "@/components/auction/CountdownTimer";
import LiveChat from "@/components/auction/LiveChat";
import MessageThreadButton from "@/components/messages/MessageThreadButton";
import FiatValue from "@/components/ui/FiatValue";
import { useToast } from "@/components/ui/Toast";
import { useBidAddressGate } from "@/hooks/useBidAddressGate";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import { getProfileSlug } from "@/lib/profile-links";
import { placeBid } from "@/lib/bids";
import type { Auction, User } from "@/lib/database.types";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";
import { getEscrowStatusLabel, getExplorerTxUrl } from "@/lib/escrow";
import { getEffectiveBid } from "@/lib/parse-auction";
import { formatSol, shortenAddress } from "@/lib/format";

function getMinimumBid(auction: Auction) {
  const floor = getEffectiveBid(auction);
  return Math.round((floor + 0.1) * 100) / 100;
}

export default function AuctionBidSidebar({
  auction,
  seller,
  bidCount: initialBidCount,
  topBidder: initialTopBidder,
  topBidderUsername: initialTopBidderUsername,
  sellerReviewCount = 0,
}: {
  auction: Auction;
  seller: User;
  bidCount: number;
  topBidder: string | null;
  topBidderUsername: string | null;
  sellerReviewCount?: number;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const connectPhantom = usePhantomConnect();
  const { publicKey, connected } = useWallet();
  const { username } = useSidebarUser();
  const wallet = publicKey?.toBase58() ?? null;
  const {
    modalOpen,
    addresses,
    loadingAddresses,
    gateBid,
    handleContinue,
    closeModal,
  } = useBidAddressGate(wallet);
  const profilePath = wallet
    ? `/profile/${getProfileSlug(username, wallet)}`
    : "/profile";

  const [bidCount, setBidCount] = useState(initialBidCount);
  const [topBidder, setTopBidder] = useState(initialTopBidder);
  const [topBidderUsername, setTopBidderUsername] = useState(
    initialTopBidderUsername
  );
  const [currentBid, setCurrentBid] = useState(getEffectiveBid(auction));
  const [bidInput, setBidInput] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [shippingBlocked, setShippingBlocked] = useState(false);

  const minimumBid = useMemo(
    () => getMinimumBid({ ...auction, current_bid: currentBid }),
    [auction, currentBid]
  );

  const isLive =
    auction.status === "live" &&
    new Date(auction.end_time).getTime() > Date.now();
  const isWinner =
    Boolean(publicKey) &&
    topBidder === publicKey?.toBase58() &&
    !isLive &&
    (auction.status === "ended" || auction.status === "completed");

  useEffect(() => {
    setBidCount(initialBidCount);
    setTopBidder(initialTopBidder);
    setTopBidderUsername(initialTopBidderUsername);
    setCurrentBid(getEffectiveBid(auction));
  }, [
    initialBidCount,
    initialTopBidder,
    initialTopBidderUsername,
    auction,
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

  const executePlaceBid = async (amount: number) => {
    if (!publicKey) return;

    const floor = Math.max(currentBid, getEffectiveBid(auction));
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

  const handlePlaceBid = async (amount: number) => {
    if (shippingBlocked) {
      showToast("This seller does not ship to your country.", "error");
      return;
    }

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

    await gateBid(() => executePlaceBid(amount));
  };

  const floor = Math.max(currentBid, getEffectiveBid(auction));
  const quickBids = [
    { label: "+0.1 SOL", amount: Math.round((floor + 0.1) * 100) / 100 },
    { label: "+0.5 SOL", amount: Math.round((floor + 0.5) * 100) / 100 },
    { label: "+1 SOL", amount: Math.round((floor + 1) * 100) / 100 },
  ];

  return (
    <>
    <BidAddressPromptModal
      open={modalOpen}
      addresses={addresses}
      profilePath={profilePath}
      onContinue={handleContinue}
      onClose={closeModal}
    />
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
          <FiatValue solAmount={currentBid} />
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
              disabled={isPlacingBid || loadingAddresses || shippingBlocked}
              onClick={() => handlePlaceBid(parseFloat(bidInput))}
              className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingBid || loadingAddresses ? "Placing bid..." : "Place Bid"}
            </button>

            <div className="grid grid-cols-3 gap-2">
              {quickBids.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  disabled={isPlacingBid || loadingAddresses || shippingBlocked}
                  onClick={() => {
                    setBidInput(quick.amount.toFixed(2));
                    void handlePlaceBid(quick.amount);
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

      <AuctionShippingInfo
        auction={auction}
        seller={seller}
        onShippingBlockedChange={setShippingBlocked}
      />

      <AuctionSellerCard seller={seller} reviewCount={sellerReviewCount} />

      {isWinner && (
        <div className="space-y-3">
          {auction.escrow_state &&
            auction.escrow_state !== "none" &&
            getEscrowStatusLabel(auction.escrow_state) && (
              <div className="rounded-xl border border-border bg-background/60 px-3 py-3">
                <p className="text-sm font-medium text-white">
                  {getEscrowStatusLabel(auction.escrow_state)}
                </p>
                {auction.escrow_tx_signature && (
                  <a
                    href={getExplorerTxUrl(auction.escrow_tx_signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-medium text-accent hover:text-purple-300"
                  >
                    View escrow transaction →
                  </a>
                )}
              </div>
            )}
          <MessageThreadButton
            variant="seller"
            auctionId={auction.id}
            auctionTitle={auction.title}
            sellerWallet={auction.seller_wallet}
            className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          />
        </div>
      )}

      <div className="min-h-[20rem]">
        <LiveChat auctionId={auction.id} />
      </div>
    </div>
    </>
  );
}
