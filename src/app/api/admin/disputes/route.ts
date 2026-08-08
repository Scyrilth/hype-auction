import { NextResponse } from "next/server";

import {
  fetchAdminThreadMessages,
  fetchDisputes,
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

  try {
    if (action === "disputes") {
      const showDummyData = searchParams.get("showDummyData") === "true";
      const resolved = searchParams.get("resolved") === "true";
      const solUsdRateRaw = searchParams.get("solUsdRate");
      if (solUsdRateRaw == null || solUsdRateRaw.trim() === "") {
        return NextResponse.json(
          { error: "solUsdRate is required." },
          { status: 400, headers }
        );
      }
      const solUsdRate = Number(solUsdRateRaw);
      if (!Number.isFinite(solUsdRate)) {
        return NextResponse.json(
          { error: "solUsdRate must be a valid number." },
          { status: 400, headers }
        );
      }

      const data = await fetchDisputes(showDummyData, resolved, solUsdRate);
      return NextResponse.json(data, { headers });
    }

    if (action === "thread-messages") {
      const threadId = searchParams.get("threadId")?.trim() ?? "";
      if (!threadId) {
        return NextResponse.json(
          { error: "threadId is required." },
          { status: 400, headers }
        );
      }
      const data = await fetchAdminThreadMessages(threadId);
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400, headers }
    );
  } catch (error) {
    logSupabaseError("api/admin/disputes GET", error);
    return NextResponse.json(
      { error: "Unable to load disputes data." },
      { status: 500, headers }
    );
  }
}
