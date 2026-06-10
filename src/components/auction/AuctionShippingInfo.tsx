"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  canShipToBuyer,
  formatShippingUsd,
  isShippingExemptAuction,
  resolveShippingUsd,
} from "@/lib/auction-shipping";
import { getCountryName } from "@/lib/countries";
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
  const { publicKey } = useWallet();
  const [buyerCountry, setBuyerCountry] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const sellerCountry = seller.country;
  const shipsInternationally = seller.ships_internationally ?? false;
  const isExempt = isShippingExemptAuction(auction);
  const sellerCountryName = getCountryName(sellerCountry);

  useEffect(() => {
    if (!publicKey) {
      setBuyerCountry(null);
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
  }, [publicKey]);

  const shipsToLabel = shipsInternationally
    ? "Worldwide"
    : `${sellerCountryName} only`;

  const shippingUsd = resolveShippingUsd({
    domesticShippingUsd: auction.domestic_shipping_usd,
    internationalShippingUsd: auction.international_shipping_usd,
    sellerCountry,
    buyerCountry,
    shipsInternationally,
    isExempt,
  });

  const shippingBlocked =
    !isExempt &&
    Boolean(buyerCountry) &&
    !canShipToBuyer({
      sellerCountry,
      shipsInternationally,
      buyerCountry,
      isExempt,
    });

  useEffect(() => {
    onShippingBlockedChange?.(shippingBlocked);
  }, [onShippingBlockedChange, shippingBlocked]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Shipping
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Ships from</dt>
          <dd className="font-medium text-white">{sellerCountryName}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Ships to</dt>
          <dd className="font-medium text-white">{shipsToLabel}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted">Shipping cost</dt>
          <dd className="font-medium text-white">
            {loadingAddress
              ? "Checking address..."
              : !buyerCountry
                ? "Shipping cost calculated at checkout"
                : shippingBlocked
                  ? "Not available to your country"
                  : shippingUsd == null
                    ? "Shipping cost calculated at checkout"
                    : `Shipping: ${formatShippingUsd(shippingUsd)}`}
          </dd>
        </div>
      </dl>

      {shippingBlocked && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
          This seller does not ship to your country.
        </div>
      )}
    </section>
  );
}
