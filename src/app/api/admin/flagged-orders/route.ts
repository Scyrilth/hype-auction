import { NextResponse } from "next/server";

import {
  fetchAdminLiveAuctions,
  fetchEarlyEndedAuctions,
  fetchFlaggedOrders,
} from "@/lib/admin/data";
import { isAdminWallet } from "@/lib/admin/config";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { requireWalletSession } from "@/lib/wallet-auth";

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const sessionResult = await requireWalletSession(request);
  if (!sessionResult.ok) {
    return NextResponse.json(
      { error: sessionResult.error },
      { status: sessionResult.status, headers }
    );
  }

  if (!isAdminWallet(sessionResult.session.wallet)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim() ?? "";
  const showDummyData = searchParams.get("showDummyData") === "true";

  try {
    if (action === "flagged") {
      const data = await fetchFlaggedOrders(showDummyData);
      return NextResponse.json(data, { headers });
    }

    if (action === "early-ended") {
      const data = await fetchEarlyEndedAuctions(showDummyData);
      return NextResponse.json(data, { headers });
    }

    if (action === "live") {
      const data = await fetchAdminLiveAuctions(showDummyData);
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400, headers }
    );
  } catch (error) {
    logSupabaseError("api/admin/flagged-orders GET", error);
    return NextResponse.json(
      { error: "Unable to load flagged orders data." },
      { status: 500, headers }
    );
  }
}
