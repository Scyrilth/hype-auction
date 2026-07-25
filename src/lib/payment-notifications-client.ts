import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

export async function postPaymentSecuredNotifications({
  auctionId,
  buyerWallet,
  threadId,
  totalSol,
}: {
  auctionId: string;
  buyerWallet: string;
  threadId?: string | null;
  totalSol: number;
}): Promise<void> {
  const response = await fetch("/api/escrow/payment-notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-wallet-address": buyerWallet,
      ...getWalletAuthHeaders(),
    },
    body: JSON.stringify({
      auctionId,
      threadId,
      totalSol,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    console.error("[payment-notifications-client] API failed", {
      status: response.status,
      body,
      auctionId,
      threadId: threadId ?? null,
    });
    throw new Error(body?.error ?? "Unable to send payment notifications.");
  }
}
