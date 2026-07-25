import { NextResponse } from "next/server";

import {
  BidPlacementError,
  placeBidWithValidation,
} from "@/lib/bid-placement";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type BidRequestBody = {
  auctionId?: unknown;
  bidderWallet?: unknown;
  amount?: unknown;
};

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  let body: BidRequestBody;

  try {
    body = (await request.json()) as BidRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
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
    return NextResponse.json(
      { error: "Auction is required." },
      { status: 400, headers }
    );
  }

  if (!bidderWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  const sessionResult = await requireWalletSession(request);
  if (!sessionResult.ok) {
    return NextResponse.json(
      { error: sessionResult.error },
      { status: sessionResult.status, headers }
    );
  }

  const walletMatch = assertWalletMatchesSession({
    session: sessionResult.session,
    claimedWallet: bidderWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (await isRateLimited(bidderWallet, "bids")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    await placeBidWithValidation({ auctionId, bidderWallet, amount });
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    if (error instanceof BidPlacementError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    logSupabaseError("api/bids POST", error);
    return NextResponse.json(
      { error: "Unable to place bid. Please try again." },
      { status: 500, headers }
    );
  }
}
