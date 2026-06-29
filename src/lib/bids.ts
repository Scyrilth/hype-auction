/** Client helper — places a bid via the server-validated API route. */
import { getErrorMessage } from "@/lib/errors";

export async function placeBid({
  auctionId,
  bidderWallet,
  amount,
}: {
  auctionId: string;
  bidderWallet: string;
  amount: number;
}) {
  const response = await fetch("/api/bids", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
