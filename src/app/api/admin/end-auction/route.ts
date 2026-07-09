import { NextResponse } from "next/server";

import { endAuctionEarlyAsAdmin, type EarlyEndReason, EARLY_END_REASONS } from "@/lib/auction-early-end";
import { isAdminWallet } from "@/lib/admin/config";
import { corsHeaders } from "@/lib/cors";
import { getErrorMessage } from "@/lib/errors";

type EndAuctionBody = {
  auctionId?: unknown;
  reason?: unknown;
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
  const wallet = request.headers.get("x-wallet-address")?.trim() ?? "";

  if (!isAdminWallet(wallet)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
  }

  let body: EndAuctionBody;
  try {
    body = (await request.json()) as EndAuctionBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const rawReason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : null;
  const reason = EARLY_END_REASONS.includes(rawReason as EarlyEndReason)
    ? (rawReason as EarlyEndReason)
    : null;

  if (!auctionId) {
    return NextResponse.json(
      { error: "Auction is required." },
      { status: 400, headers }
    );
  }

  try {
    await endAuctionEarlyAsAdmin({ auctionId, reason });
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("[admin/end-auction] failed:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to end auction.") },
      { status: 400, headers }
    );
  }
}
