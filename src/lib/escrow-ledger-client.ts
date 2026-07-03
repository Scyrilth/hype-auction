type EscrowLedgerApiPayload = {
  type: string;
  auctionId: string;
  threadId?: string | null;
  buyerWallet?: string;
  sellerWallet?: string;
  escrowPda?: string;
  amountLamports?: number;
  bidLamports?: number;
  shippingLamports?: number;
  totalLamports?: number;
  onChainSignature?: string | null;
  releaseToSeller?: boolean;
};

export async function postEscrowLedgerEvent(
  payload: EscrowLedgerApiPayload,
  wallet: string
): Promise<void> {
  console.log("[escrow-ledger-client] postEscrowLedgerEvent", {
    type: payload.type,
    auctionId: payload.auctionId,
    threadId: payload.threadId ?? null,
    wallet,
  });

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
    console.error("[escrow-ledger-client] ledger API failed", {
      status: response.status,
      statusText: response.statusText,
      body,
      payload: {
        type: payload.type,
        auctionId: payload.auctionId,
        threadId: payload.threadId ?? null,
      },
    });
    throw new Error(body?.error ?? "Unable to record escrow ledger event.");
  }
}

export function isBrowserLedgerWrite(): boolean {
  return typeof window !== "undefined";
}
