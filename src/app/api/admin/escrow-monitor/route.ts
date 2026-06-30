import { NextResponse } from "next/server";

import { fetchEscrowMonitor } from "@/lib/admin/data";
import { isAdminWallet } from "@/lib/admin/config";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const wallet =
    request.headers.get("x-wallet-address")?.trim() ??
    new URL(request.url).searchParams.get("wallet")?.trim() ??
    "";

  if (!isAdminWallet(wallet)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
  }

  const showDummyData =
    new URL(request.url).searchParams.get("showDummyData") === "true";

  try {
    const data = await fetchEscrowMonitor(showDummyData);
    return NextResponse.json(data, { headers });
  } catch (error) {
    logSupabaseError("api/admin/escrow-monitor GET", error);
    return NextResponse.json(
      { error: "Unable to load escrow monitor." },
      { status: 500, headers }
    );
  }
}
