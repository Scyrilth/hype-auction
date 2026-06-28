import { NextResponse } from "next/server";

import {
  BidPlacementError,
  placeBidWithValidation,
} from "@/lib/bid-placement";
import { logSupabaseError } from "@/lib/errors";

type BidRequestBody = {
  auctionId?: unknown;
  bidderWallet?: unknown;
  amount?: unknown;
};

export async function POST(request: Request) {
  let body: BidRequestBody;

  try {
    body = (await request.json()) as BidRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const bidderWallet =
    typeof body.bidderWallet === "string" ? body.bidderWallet.trim() : "";
  const amount =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string"
        ? Number(body.amount)
        : NaN;

  if (!auctionId) {
    return NextResponse.json({ error: "Auction is required." }, { status: 400 });
  }

  if (!bidderWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400 }
    );
  }

  try {
    await placeBidWithValidation({ auctionId, bidderWallet, amount });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BidPlacementError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logSupabaseError("api/bids POST", error);
    return NextResponse.json(
      { error: "Unable to place bid. Please try again." },
      { status: 500 }
    );
  }
}
