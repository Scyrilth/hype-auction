import type { Auction } from "@/lib/database.types";

export function isDummyEscrowSignature(signature: string | null | undefined): boolean {
  if (!signature) return false;
  return (
    signature.startsWith("dummy_tx_") || signature.startsWith("admin_dummy_")
  );
}

export function isRealAuction(
  auction: Pick<Auction, "is_dummy" | "escrow_tx_signature">
): boolean {
  return !auction.is_dummy && !isDummyEscrowSignature(auction.escrow_tx_signature);
}

export function passesDummyFilter(
  auction: Pick<Auction, "is_dummy" | "escrow_tx_signature">,
  showDummyData: boolean
): boolean {
  if (showDummyData) return true;
  return isRealAuction(auction);
}
