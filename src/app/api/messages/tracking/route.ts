import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { logSupabaseError, isSafeUserFacingMessage } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { submitThreadShippingTracking } from "@/lib/seller-orders";
import { getAuthenticatedClient } from "@/lib/supabase";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type TrackingRequestBody = {
  threadId?: unknown;
  sellerWallet?: unknown;
  carrier?: unknown;
  trackingNumber?: unknown;
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
  let body: TrackingRequestBody;

  try {
    body = (await request.json()) as TrackingRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const threadId =
    typeof body.threadId === "string" ? body.threadId.trim() : "";
  const sellerWallet =
    typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
  const carrier = typeof body.carrier === "string" ? body.carrier.trim() : "";
  const trackingNumber =
    typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread is required." },
      { status: 400, headers }
    );
  }

  if (!sellerWallet) {
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
    claimedWallet: sellerWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (isRateLimited(sellerWallet, "messages")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    const client = getAuthenticatedClient(sellerWallet);
    const thread = await submitThreadShippingTracking({
      threadId,
      sellerWallet,
      carrier,
      trackingNumber,
      client,
    });

    return NextResponse.json(
      {
        success: true,
        threadId: thread.id,
        auctionId: thread.auction_id,
      },
      { headers }
    );
  } catch (error) {
    logSupabaseError("api/messages/tracking POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to upload tracking. Please try again." },
      { status: 500, headers }
    );
  }
}
