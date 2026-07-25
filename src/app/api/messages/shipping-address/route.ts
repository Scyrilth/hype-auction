import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { getNotificationClient } from "@/lib/supabase";
import {
  confirmThreadShippingAddress,
  ThreadShippingError,
  verifyThreadShippingForPayment,
} from "@/lib/thread-shipping";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type ShippingAddressRequestBody = {
  action?: unknown;
  threadId?: unknown;
  auctionId?: unknown;
  buyerWallet?: unknown;
  addressId?: unknown;
};

function resolveBuyerWallet(
  headerWallet: string,
  bodyWallet: string
): { wallet: string; mismatch: boolean } {
  if (headerWallet && bodyWallet && headerWallet !== bodyWallet) {
    return { wallet: "", mismatch: true };
  }
  return { wallet: headerWallet || bodyWallet, mismatch: false };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  let body: ShippingAddressRequestBody;

  try {
    body = (await request.json()) as ShippingAddressRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const bodyWallet =
    typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
  const headerWallet = request.headers.get("x-wallet-address")?.trim() ?? "";
  const { wallet: buyerWallet, mismatch } = resolveBuyerWallet(
    headerWallet,
    bodyWallet
  );
  const addressId =
    typeof body.addressId === "string" ? body.addressId.trim() : "";

  console.log(
    `[messages/shipping-address] ${action || "(no action)"} - threadId: ${threadId || "(none)"}, auctionId: ${auctionId || "(none)"}, headerWallet: ${headerWallet || "(none)"}, bodyWallet: ${bodyWallet || "(none)"}`
  );

  if (mismatch) {
    return NextResponse.json(
      { error: "Wallet mismatch." },
      { status: 403, headers }
    );
  }

  if (!threadId && !auctionId) {
    return NextResponse.json(
      { error: "Thread or auction is required." },
      { status: 400, headers }
    );
  }

  if (!buyerWallet) {
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
    claimedWallet: buyerWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (isRateLimited(buyerWallet, "messages")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  const db = getNotificationClient();

  try {
    if (action === "confirm") {
      const result = await confirmThreadShippingAddress({
        threadId,
        buyerWallet,
        addressId,
        auctionId: auctionId || null,
        client: db,
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    if (action === "verify-payment") {
      const result = await verifyThreadShippingForPayment({
        threadId,
        buyerWallet,
        auctionId: auctionId || null,
        client: db,
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400, headers }
    );
  } catch (error) {
    if (error instanceof ThreadShippingError) {
      console.error("[messages/shipping-address] ThreadShippingError:", error.message, {
        threadId,
        auctionId,
        buyerWallet,
      });
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }

    logSupabaseError("api/messages/shipping-address POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }

    return NextResponse.json(
      { error: "Unable to update shipping address. Please try again." },
      { status: 500, headers }
    );
  }
}
