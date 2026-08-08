import { NextResponse } from "next/server";

import {
  BuyNowError,
  completeBuyNowPurchase,
  confirmBuyNowShippingAddress,
} from "@/lib/buy-now";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { getNotificationClient } from "@/lib/supabase";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type BuyNowRequestBody = {
  action?: unknown;
  auctionId?: unknown;
  buyerWallet?: unknown;
  addressId?: unknown;
  threadId?: unknown;
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
  let body: BuyNowRequestBody;

  try {
    body = (await request.json()) as BuyNowRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const buyerWallet =
    typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
  const addressId =
    typeof body.addressId === "string" ? body.addressId.trim() : "";
  const threadId =
    typeof body.threadId === "string" ? body.threadId.trim() : "";

  if (!auctionId || !buyerWallet) {
    return NextResponse.json(
      { error: "Auction and wallet are required." },
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
    claimedWallet: buyerWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (await isRateLimited(buyerWallet, "bids")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    if (action === "confirm-shipping") {
      const result = await confirmBuyNowShippingAddress({
        auctionId,
        buyerWallet,
        addressId,
        client: getNotificationClient(),
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    if (action === "complete") {
      const result = await completeBuyNowPurchase({
        auctionId,
        buyerWallet,
        threadId: threadId || null,
        client: getNotificationClient(),
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400, headers }
    );
  } catch (error) {
    if (error instanceof BuyNowError) {
      return NextResponse.json({ error: error.message }, { status: 409, headers });
    }
    logSupabaseError("api/auctions/buy-now POST", error);
    return NextResponse.json(
      { error: "Unable to process Buy Now request." },
      { status: 500, headers }
    );
  }
}
