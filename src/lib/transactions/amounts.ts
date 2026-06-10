import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import type { Auction } from "@/lib/database.types";
import { PLATFORM_FEE_BPS } from "@/lib/escrow";
import { getEffectiveBid } from "@/lib/parse-auction";
import type { TransactionAmounts } from "./types";

export function resolveUsdRate(
  auction: Auction,
  currentRate: number
): { rate: number; usesHistoricalRate: boolean } {
  const stored = auction.sol_usd_rate_at_payment;
  if (stored != null && Number.isFinite(stored) && stored > 0) {
    return { rate: stored, usesHistoricalRate: true };
  }

  return {
    rate: currentRate > 0 ? currentRate : 0,
    usesHistoricalRate: false,
  };
}

export function computeTransactionAmounts(
  auction: Auction,
  currentRateFallback: number
): TransactionAmounts {
  const { rate: solUsdRate, usesHistoricalRate } = resolveUsdRate(
    auction,
    currentRateFallback
  );

  const itemSol = getEffectiveBid(auction);
  const shippingUsd = auction.domestic_shipping_usd ?? 0;
  const shippingSol = solUsdRate > 0 ? shippingUsd / solUsdRate : 0;

  let totalSol = itemSol + shippingSol;

  if (auction.escrow_amount_lamports && auction.escrow_amount_lamports > 0) {
    totalSol = auction.escrow_amount_lamports / LAMPORTS_PER_SOL;
    const derivedShipping = Math.max(0, totalSol - itemSol);
    if (derivedShipping > 0) {
      return buildAmounts(
        itemSol,
        derivedShipping,
        shippingUsd,
        solUsdRate,
        usesHistoricalRate
      );
    }
  }

  return buildAmounts(
    itemSol,
    shippingSol,
    shippingUsd,
    solUsdRate,
    usesHistoricalRate
  );
}

function buildAmounts(
  itemSol: number,
  shippingSol: number,
  shippingUsd: number,
  solUsdRate: number,
  usesHistoricalRate: boolean
): TransactionAmounts {
  const subtotal = itemSol + shippingSol;
  const feeSol = (subtotal * PLATFORM_FEE_BPS) / 10_000;
  const netSol = subtotal - feeSol;
  const totalSol = subtotal;

  return {
    itemSol,
    shippingSol,
    shippingUsd,
    feeSol,
    netSol,
    totalSol,
    usdApprox: totalSol * solUsdRate,
    usdRateUsed: solUsdRate,
    usesHistoricalRate,
  };
}
