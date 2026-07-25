import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { getNotificationClient } from "@/lib/supabase";
import { fetchTransactionsData } from "@/lib/transactions/data";
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
  const wallet = sessionResult.session.wallet;

  const rateParam = new URL(request.url).searchParams.get("rate");
  const rate =
    rateParam != null && Number.isFinite(Number(rateParam)) && Number(rateParam) > 0
      ? Number(rateParam)
      : 132.5;

  try {
    const data = await fetchTransactionsData(
      wallet,
      rate,
      getNotificationClient()
    );
    return NextResponse.json(data, { headers });
  } catch (error) {
    logSupabaseError("api/transactions GET", error);
    return NextResponse.json(
      { error: "Unable to load transactions." },
      { status: 500, headers }
    );
  }
}
