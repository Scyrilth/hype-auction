import { countriesMatch } from "@/lib/countries";

const SEEDED_DUMMY_WALLET_PREFIXES = ["DUMMY_VENDOR_", "DUMMY_REVIEWER_"] as const;

/** Seeded SQL dummy accounts (vendor + reviewer personas). */
export function isSeededDummyWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false;
  return SEEDED_DUMMY_WALLET_PREFIXES.some((prefix) => wallet.startsWith(prefix));
}

export function isDummySellerWallet(wallet: string | null | undefined): boolean {
  return isSeededDummyWallet(wallet);
}

export function isShippingExemptAuction(auction: {
  is_dummy?: boolean;
  seller_wallet?: string;
}): boolean {
  return Boolean(auction.is_dummy) || isDummySellerWallet(auction.seller_wallet);
}

export function canShipToBuyer({
  sellerCountry,
  shipsInternationally,
  buyerCountry,
  isExempt = false,
}: {
  sellerCountry: string | null | undefined;
  shipsInternationally: boolean;
  buyerCountry: string | null | undefined;
  isExempt?: boolean;
}): boolean {
  if (isExempt) return true;
  if (!buyerCountry?.trim() || !sellerCountry?.trim()) return true;
  if (countriesMatch(sellerCountry, buyerCountry)) return true;
  return shipsInternationally;
}

export function resolveShippingUsd({
  domesticShippingUsd,
  internationalShippingUsd,
  sellerCountry,
  buyerCountry,
  shipsInternationally,
  isExempt = false,
}: {
  domesticShippingUsd: number;
  internationalShippingUsd: number;
  sellerCountry: string | null | undefined;
  buyerCountry: string | null | undefined;
  shipsInternationally: boolean;
  isExempt?: boolean;
}): number | null {
  if (isExempt) return 0;
  if (!buyerCountry?.trim()) return null;

  if (!sellerCountry?.trim() || countriesMatch(sellerCountry, buyerCountry)) {
    return domesticShippingUsd;
  }

  if (!shipsInternationally) return null;
  return internationalShippingUsd;
}

export function formatDomesticShippingLine(domesticShippingUsd: number): string {
  if (domesticShippingUsd <= 0) return "Free shipping";
  return `+ $${domesticShippingUsd.toFixed(2)} shipping`;
}

export function formatAuctionCardShippingLine({
  domesticShippingUsd = 0,
  internationalShippingUsd = 0,
  freeShipping = false,
  isExempt = false,
}: {
  domesticShippingUsd?: number;
  internationalShippingUsd?: number;
  freeShipping?: boolean;
  isExempt?: boolean;
}): string | null {
  if (isExempt) return null;

  const domestic = domesticShippingUsd ?? 0;
  const international = internationalShippingUsd ?? 0;

  if (freeShipping || (domestic <= 0 && international <= 0)) {
    return "Free shipping";
  }

  const hasDomestic = domestic > 0;
  const hasInternational = international > 0;

  if (hasDomestic && hasInternational) {
    return `$${domestic.toFixed(2)} domestic · $${international.toFixed(2)} intl`;
  }

  if (hasDomestic) {
    return `$${domestic.toFixed(2)} shipping`;
  }

  if (hasInternational) {
    return `$${international.toFixed(2)} shipping`;
  }

  return null;
}

export function formatShippingUsd(amount: number): string {
  if (amount <= 0) return "Free";
  return `$${amount.toFixed(2)}`;
}

/** Public-facing ships-to label. Never exposes seller country. */
export function getPublicShipsToLabel(
  sellerCountry: string | null | undefined,
  shipsInternationally: boolean | null | undefined,
  isExempt = false
): string | null {
  if (isExempt && !sellerCountry?.trim()) {
    return null;
  }

  if (!sellerCountry?.trim()) {
    return null;
  }

  if (shipsInternationally) {
    return "Worldwide";
  }

  return "Domestic only";
}

export const FREE_SHIPPING_WARNING =
  "Free shipping means you cover the cost. Make sure your starting bid is high enough to cover your shipping and item costs — auctions can end at the starting price.";
