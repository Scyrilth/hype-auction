import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import {
  confirmThreadShippingAddress,
  ThreadShippingError,
  verifyThreadShippingForPayment,
} from "@/lib/thread-shipping";

type ShippingAddressRequestBody = {
  action?: unknown;
  threadId?: unknown;
  buyerWallet?: unknown;
  addressId?: unknown;
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
  const buyerWallet =
    typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
  const addressId =
    typeof body.addressId === "string" ? body.addressId.trim() : "";

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread is required." },
      { status: 400, headers }
    );
  }

  if (!buyerWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  if (isRateLimited(buyerWallet, "messages")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    if (action === "confirm") {
      const result = await confirmThreadShippingAddress({
        threadId,
        buyerWallet,
        addressId,
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    if (action === "verify-payment") {
      const result = await verifyThreadShippingForPayment({
        threadId,
        buyerWallet,
      });
      return NextResponse.json({ success: true, ...result }, { headers });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400, headers }
    );
  } catch (error) {
    if (error instanceof ThreadShippingError) {
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
