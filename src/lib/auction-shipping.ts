import { countriesMatch } from "@/lib/countries";

export function isDummySellerWallet(wallet: string | null | undefined): boolean {
  return Boolean(wallet?.startsWith("DUMMY_VENDOR_"));
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

export function formatShippingUsd(amount: number): string {
  if (amount <= 0) return "Free";
  return `$${amount.toFixed(2)}`;
}
