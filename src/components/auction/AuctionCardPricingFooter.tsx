"use client";

import AuctionCardBidLine from "@/components/auction/AuctionCardBidLine";
import { BuyNowCardButton } from "@/components/auction/BuyNowButton";
import { AuctionCardShippingLine } from "@/components/auction/AuctionCardLayout";
import CountdownTimer from "@/components/auction/CountdownTimer";
import type { Auction } from "@/lib/database.types";
import {
  getBuyNowPrice,
  getCardDisplayPrice,
  hasBuyNowOption,
  isFixedPriceListing,
  isListingLive,
  shouldShowCountdown,
} from "@/lib/listing-types";
import { formatSol } from "@/lib/format";

type ShippingProps = {
  domesticShippingUsd?: number;
  internationalShippingUsd?: number;
  freeShipping?: boolean;
  isExempt?: boolean;
};

export function AuctionCardBidCount({ count }: { count?: number }) {
  if (count === undefined || count <= 0) return null;

  return (
    <p className="mt-0.5 text-[10px] text-muted">
      {count} {count === 1 ? "bid" : "bids"}
    </p>
  );
}

export function AuctionCardTimeLeftRow({ endTime }: { endTime: string }) {
  return (
    <p className="mt-0.5 text-right text-[10px] leading-tight text-muted">
      <span>Time left</span>
      <span className="ml-1.5 inline-block">
        <CountdownTimer endTime={endTime} variant="card" />
      </span>
    </p>
  );
}

export default function AuctionCardPricingFooter({
  auction,
  amount,
  shipping,
  endTime,
  showTimeLeft = false,
  bidCount,
  emptyAmountLabel = "— SOL",
}: {
  auction?: Auction;
  amount: number;
  shipping?: ShippingProps;
  endTime?: string;
  showTimeLeft?: boolean;
  bidCount?: number;
  emptyAmountLabel?: string;
}) {
  const fixedPrice = auction ? isFixedPriceListing(auction) : false;
  const buyNowPrice = auction ? getBuyNowPrice(auction) : null;
  const showBuyNowOnCard =
    auction &&
    hasBuyNowOption(auction) &&
    !fixedPrice &&
    buyNowPrice != null &&
    isListingLive(auction);

  const displayAmount = auction ? getCardDisplayPrice(auction) : amount;
  const showTimer = auction
    ? shouldShowCountdown(auction)
    : showTimeLeft && Boolean(endTime);

  return (
    <div className="space-y-0">
      {fixedPrice ? (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Fixed Price
          </p>
          {displayAmount > 0 ? (
            <AuctionCardBidLine amount={displayAmount} />
          ) : (
            <p className="whitespace-nowrap text-[15px] font-bold leading-tight text-accent">
              {emptyAmountLabel}
            </p>
          )}
        </>
      ) : displayAmount > 0 ? (
        <AuctionCardBidLine amount={displayAmount} />
      ) : (
        <p className="whitespace-nowrap text-[15px] font-bold leading-tight text-accent">
          {emptyAmountLabel}
        </p>
      )}

      {shipping ? <AuctionCardShippingLine className="mt-0.5" {...shipping} /> : null}

      {showTimer && endTime ? <AuctionCardTimeLeftRow endTime={endTime} /> : null}

      {!fixedPrice ? <AuctionCardBidCount count={bidCount} /> : null}

      {showBuyNowOnCard && auction ? (
        <>
          <BuyNowCardButton auction={auction} />
          <p className="mt-0.5 text-center text-[9px] text-muted">or buy instantly</p>
        </>
      ) : null}

      {fixedPrice && auction && isListingLive(auction) ? (
        <BuyNowCardButton auction={auction} />
      ) : null}
    </div>
  );
}

export function FixedPriceCardLabel({ priceSol }: { priceSol: number }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-300">
      Fixed Price · {formatSol(priceSol)}
    </p>
  );
}
