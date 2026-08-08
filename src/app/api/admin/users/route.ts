import { NextResponse } from "next/server";

import {
  fetchRecentUsers,
  fetchUserStrikes,
  searchAdminUser,
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
  const action = searchParams.get("action")?.trim() || "recent";

  try {
    if (action === "recent") {
      const data = await fetchRecentUsers();
      return NextResponse.json(data, { headers });
    }

    if (action === "search") {
      const query = searchParams.get("query")?.trim() ?? "";
      if (!query) {
        return NextResponse.json(
          { error: "Query is required." },
          { status: 400, headers }
        );
      }
      const data = await searchAdminUser(query);
      return NextResponse.json(data, { headers });
    }

    if (action === "strikes") {
      const wallet = searchParams.get("wallet")?.trim() ?? "";
      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet is required." },
          { status: 400, headers }
        );
      }
      const data = await fetchUserStrikes(wallet);
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400, headers }
    );
  } catch (error) {
    logSupabaseError("api/admin/users GET", error);
    return NextResponse.json(
      { error: "Unable to load admin user data." },
      { status: 500, headers }
    );
  }
}
