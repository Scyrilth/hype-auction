"use client";

import Link from "next/link";
import { useState } from "react";

import FiatValue from "@/components/ui/FiatValue";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errors";
import { formatSol, shortenAddress, displaySocialHandle } from "@/lib/format";
import {
  offerToNextBidder,
  type NextBidderRow,
  type UnpaidAuctionAction,
} from "@/lib/non-payment-resolution";
import { getProfileHref } from "@/lib/profile-links";

import RelistAuctionModal from "./RelistAuctionModal";

const profileLinkClass =
  "transition-colors hover:text-purple-300 hover:underline decoration-purple-500/50 underline-offset-2";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-surface-elevated disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmClassName}`}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function NextBidderList({ bidders }: { bidders: NextBidderRow[] }) {
  if (!bidders.length) {
    return (
      <p className="text-sm text-muted">
        No additional bidders available. You can relist this item.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {bidders.map((bidder) => (
        <li
          key={bidder.wallet}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">
              #{bidder.rank}
            </span>
            <Link
              href={getProfileHref(bidder.username, bidder.wallet)}
              className={`text-sm font-medium text-white ${profileLinkClass}`}
            >
              {bidder.username
                ? displaySocialHandle(bidder.username)
                : shortenAddress(bidder.wallet, 4)}
            </Link>
            {bidder.isNextInLine && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Next in line
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-white">
              {formatSol(bidder.amount)}
            </span>
            <FiatValue solAmount={bidder.amount} showTooltip={false} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function UnpaidAuctionCard({
  action,
  sellerWallet,
  onRefresh,
}: {
  action: UnpaidAuctionAction;
  sellerWallet: string;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const { auction, winnerWallet, nextBidders } = action;
  const topBidder = nextBidders[0];
  const [offerOpen, setOfferOpen] = useState(false);
  const [relistOpen, setRelistOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOffer = async () => {
    if (!topBidder) return;
    setLoading(true);
    try {
      await offerToNextBidder({
        auctionId: auction.id,
        sellerWallet,
        bidderWallet: topBidder.wallet,
      });
      showToast(`Offer sent to ${formatSol(topBidder.amount)} bidder.`);
      setOfferOpen(false);
      onRefresh();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-amber-500/30 bg-surface">
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-amber-100">
            Winner didn&apos;t pay — action required
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <Link
              href={`/auction/${auction.id}`}
              className="text-base font-semibold text-white transition-colors hover:text-accent"
            >
              {auction.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Winning bid:</span>
              <span className="font-semibold text-white">
                {formatSol(auction.current_bid)}
              </span>
              <FiatValue solAmount={auction.current_bid} />
            </div>
            {winnerWallet && (
              <p className="mt-1 text-xs text-muted">
                Winner:{" "}
                <Link
                  href={getProfileHref(null, winnerWallet)}
                  className={profileLinkClass}
                >
                  {shortenAddress(winnerWallet, 6)}
                </Link>
              </p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Next highest bidders
            </h4>
            <NextBidderList bidders={nextBidders} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!topBidder || loading}
              onClick={() => setOfferOpen(true)}
              className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Offer to next bidder
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRelistOpen(true)}
              className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              Relist item
            </button>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={offerOpen}
        title="Offer to next bidder?"
        description={
          topBidder
            ? `Offer ${auction.title} to ${
                topBidder.username
                  ? displaySocialHandle(topBidder.username)
                  : shortenAddress(topBidder.wallet, 4)
              } for ${formatSol(topBidder.amount)}. They will have 2 hours to accept or decline.`
            : ""
        }
        confirmLabel="Send offer"
        confirmClassName="bg-emerald-600 hover:bg-emerald-500"
        loading={loading}
        onCancel={() => setOfferOpen(false)}
        onConfirm={() => void handleOffer()}
      />

      <RelistAuctionModal
        open={relistOpen}
        auction={auction}
        excludeWallets={[winnerWallet, ...auction.payment_excluded_wallets]}
        sellerWallet={sellerWallet}
        onClose={() => setRelistOpen(false)}
        onRelisted={() => {
          setRelistOpen(false);
          onRefresh();
        }}
      />
    </>
  );
}
