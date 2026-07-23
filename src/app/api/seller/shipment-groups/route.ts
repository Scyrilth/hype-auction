import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { createShipmentGroup } from "@/lib/shipment-groups";
import { getAuthenticatedClient } from "@/lib/supabase";

type ShipmentGroupRequestBody = {
  sellerWallet?: unknown;
  auctionIds?: unknown;
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
  let body: ShipmentGroupRequestBody;

  try {
    body = (await request.json()) as ShipmentGroupRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const sellerWallet =
    typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
  const auctionIds = Array.isArray(body.auctionIds)
    ? body.auctionIds.filter((id): id is string => typeof id === "string")
    : [];

  if (!sellerWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  if (auctionIds.length < 2) {
    return NextResponse.json(
      { error: "Select at least two orders to bundle." },
      { status: 400, headers }
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
    const result = await createShipmentGroup({
      sellerWallet,
      auctionIds,
      client,
    });

    return NextResponse.json(
      {
        success: true,
        groupId: result.group.id,
        bundleReference: result.group.bundle_reference,
        auctionIds: result.auctionIds,
      },
      { headers }
    );
  } catch (error) {
    logSupabaseError("api/seller/shipment-groups POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to create bundle. Please try again." },
      { status: 500, headers }
    );
  }
}
