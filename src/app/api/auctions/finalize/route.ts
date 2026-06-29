import { NextResponse } from "next/server";

import {
  finalizeAuctionWinnerFlow,
  recoverUnfinalizedEndedAuctions,
} from "@/lib/auction-lifecycle";
import { corsHeaders } from "@/lib/cors";

type FinalizeRequestBody = {
  auctionId?: unknown;
  recoverAll?: unknown;
};

/**
 * Manually run the winner flow for an ended auction (or recover all recent gaps).
 * Protected with CRON_SECRET — same as /api/cron/end-auctions.
 */
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  let body: FinalizeRequestBody = {};
  try {
    body = (await request.json()) as FinalizeRequestBody;
  } catch {
    // Empty body is allowed when recoverAll is not set and auctionId missing.
  }

  try {
    if (body.recoverAll === true) {
      const recoveredCount = await recoverUnfinalizedEndedAuctions();
      return NextResponse.json(
        { success: true, recoveredCount, timestamp: new Date().toISOString() },
        { headers }
      );
    }

    const auctionId =
      typeof body.auctionId === "string" ? body.auctionId.trim() : "";

    if (!auctionId) {
      return NextResponse.json(
        { error: "auctionId is required." },
        { status: 400, headers }
      );
    }

    const finalized = await finalizeAuctionWinnerFlow(auctionId);

    return NextResponse.json(
      {
        success: finalized,
        auctionId,
        timestamp: new Date().toISOString(),
      },
      { headers }
    );
  } catch (error) {
    console.error("[api/auctions/finalize] error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers }
    );
  }
}
