/** Client helper — places a bid via the server-validated API route. */
import { getErrorMessage } from "@/lib/errors";
import { getWalletAuthHeaders } from "@/lib/wallet-auth-client";

export async function placeBid({
  auctionId,
  bidderWallet,
  amount,
}: {
  auctionId: string;
  bidderWallet: string;
  amount: number;
}) {
  const authHeaders = getWalletAuthHeaders();
  if (!authHeaders.Authorization) {
    throw new Error("Complete wallet sign-in to place a bid.");
  }

  const response = await fetch("/api/bids", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ auctionId, bidderWallet, amount }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload.error, "Unable to place bid. Please try again.")
    );
  }
}
