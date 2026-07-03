"use client";

import AuctionCardBidLine from "@/components/auction/AuctionCardBidLine";
import { AuctionCardShippingLine } from "@/components/auction/AuctionCardLayout";
import CountdownTimer from "@/components/auction/CountdownTimer";

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
  amount,
  shipping,
  endTime,
  showTimeLeft = false,
  bidCount,
  emptyAmountLabel = "— SOL",
}: {
  amount: number;
  shipping?: ShippingProps;
  endTime?: string;
  showTimeLeft?: boolean;
  bidCount?: number;
  emptyAmountLabel?: string;
}) {
  return (
    <div className="space-y-0">
      {amount > 0 ? (
        <AuctionCardBidLine amount={amount} />
      ) : (
        <p className="whitespace-nowrap text-[15px] font-bold leading-tight text-accent">
          {emptyAmountLabel}
        </p>
      )}

      {shipping ? <AuctionCardShippingLine className="mt-0.5" {...shipping} /> : null}

      {showTimeLeft && endTime ? <AuctionCardTimeLeftRow endTime={endTime} /> : null}

      <AuctionCardBidCount count={bidCount} />
    </div>
  );
}
