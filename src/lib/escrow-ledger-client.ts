type EscrowLedgerApiPayload = {
  type: string;
  auctionId: string;
  threadId?: string | null;
  buyerWallet?: string;
  sellerWallet?: string;
  escrowPda?: string;
  amountLamports?: number;
  totalLamports?: number;
  onChainSignature?: string | null;
  releaseToSeller?: boolean;
};

export async function postEscrowLedgerEvent(
  payload: EscrowLedgerApiPayload,
  wallet: string
): Promise<void> {
  const response = await fetch("/api/escrow/ledger", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wallet-address": wallet,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Unable to record escrow ledger event.");
  }
}

export function isBrowserLedgerWrite(): boolean {
  return typeof window !== "undefined";
}
