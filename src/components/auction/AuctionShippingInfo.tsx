"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  canShipToBuyer,
  formatShippingUsd,
  getPublicShipsToLabel,
  isShippingExemptAuction,
  resolveShippingUsd,
} from "@/lib/auction-shipping";
import type { Auction, User } from "@/lib/database.types";
import { getDefaultShippingAddress } from "@/lib/shipping";

export default function AuctionShippingInfo({
  auction,
  seller,
  onShippingBlockedChange,
}: {
  auction: Auction;
  seller: User;
  onShippingBlockedChange?: (blocked: boolean) => void;
}) {
  const { publicKey, connected } = useWallet();
  const [buyerCountry, setBuyerCountry] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const sellerCountry = seller.country;
  const shipsInternationally = seller.ships_internationally ?? false;
  const isExempt = isShippingExemptAuction(auction);
  const shipsToLabel = getPublicShipsToLabel(
    sellerCountry,
    shipsInternationally,
    isExempt
  );

  const domesticRateLabel =
    isExempt || auction.domestic_shipping_usd <= 0
      ? "Free"
      : formatShippingUsd(auction.domestic_shipping_usd);

  const internationalRateLabel =
    shipsInternationally &&
    (isExempt || auction.international_shipping_usd <= 0
      ? "Free"
      : formatShippingUsd(auction.international_shipping_usd));

  useEffect(() => {
    if (!connected || !publicKey) {
      setBuyerCountry(null);
      setLoadingAddress(false);
      return;
    }

    let cancelled = false;
    setLoadingAddress(true);

    void getDefaultShippingAddress(publicKey.toBase58())
      .then((address) => {
        if (!cancelled) {
          setBuyerCountry(address?.country ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey]);

  const personalizedShippingUsd =
    connected && buyerCountry
      ? resolveShippingUsd({
          domesticShippingUsd: auction.domestic_shipping_usd,
          internationalShippingUsd: auction.international_shipping_usd,
          sellerCountry,
          buyerCountry,
          shipsInternationally,
          isExempt,
        })
      : null;

  const shippingBlocked =
    connected &&
    Boolean(buyerCountry) &&
    !isExempt &&
    !canShipToBuyer({
      sellerCountry,
      shipsInternationally,
      buyerCountry,
      isExempt,
    });

  useEffect(() => {
    onShippingBlockedChange?.(
      connected && buyerCountry ? shippingBlocked : false
    );
  }, [onShippingBlockedChange, shippingBlocked, connected, buyerCountry]);

  const yourShippingLabel = !connected
    ? null
    : loadingAddress
      ? "Checking your address..."
      : !buyerCountry
        ? null
        : shippingBlocked
          ? "Not available to your country"
          : personalizedShippingUsd == null
            ? null
            : formatShippingUsd(personalizedShippingUsd);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Shipping
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        {shipsToLabel && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Ships to</dt>
            <dd className="font-medium text-white">{shipsToLabel}</dd>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Domestic shipping</dt>
          <dd className="font-medium text-white">{domesticRateLabel}</dd>
        </div>
        {shipsInternationally && internationalRateLabel && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">International shipping</dt>
            <dd className="font-medium text-white">{internationalRateLabel}</dd>
          </div>
        )}
        {yourShippingLabel && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Your shipping</dt>
            <dd className="font-medium text-white">{yourShippingLabel}</dd>
          </div>
        )}
      </dl>

      {shippingBlocked && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
          This seller does not ship to your country.
        </div>
      )}
    </section>
  );
}
