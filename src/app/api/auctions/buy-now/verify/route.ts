import { NextResponse } from "next/server";

import {
  BuyNowError,
  verifyBuyNowAvailable,
} from "@/lib/buy-now";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  let body: { auctionId?: unknown; buyerWallet?: unknown };

  try {
    body = (await request.json()) as { auctionId?: unknown; buyerWallet?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const buyerWallet =
    typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";

  if (!auctionId || !buyerWallet) {
    return NextResponse.json(
      { error: "Auction and wallet are required." },
      { status: 400, headers }
    );
  }

  if (isRateLimited(buyerWallet, "bids")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    const auction = await verifyBuyNowAvailable(auctionId, buyerWallet);
    return NextResponse.json(
      {
        success: true,
        buyNowPrice: auction.buy_now_price,
        listingType: auction.listing_type,
      },
      { headers }
    );
  } catch (error) {
    if (error instanceof BuyNowError) {
      return NextResponse.json({ error: error.message }, { status: 409, headers });
    }
    logSupabaseError("api/auctions/buy-now/verify POST", error);
    return NextResponse.json(
      { error: "Unable to verify listing availability." },
      { status: 500, headers }
    );
  }
}
