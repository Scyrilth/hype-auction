import { NextResponse } from "next/server";

import {
  issueBuyerStrike,
  liftBuyerRestrictions,
  type StrikeAction,
} from "@/lib/admin/actions";
import { isAdminWallet } from "@/lib/admin/config";
import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { getNotificationClient } from "@/lib/supabase";
import { requireWalletSession } from "@/lib/wallet-auth";

const STRIKE_REASONS: readonly StrikeAction[] = [
  "warning",
  "cooldown_24h",
  "suspension_7d",
  "ban",
];

type UserActionsBody = {
  action?: unknown;
  wallet?: unknown;
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

  let body: UserActionsBody;
  try {
    body = (await request.json()) as UserActionsBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet is required." },
      { status: 400, headers }
    );
  }

  try {
    if (action === "lift") {
      await liftBuyerRestrictions(wallet, getNotificationClient());
      return NextResponse.json({ success: true }, { headers });
    }

    if (action === "strike") {
      const reason =
        typeof body.reason === "string" ? body.reason.trim() : "";
      if (!STRIKE_REASONS.includes(reason as StrikeAction)) {
        return NextResponse.json(
          { error: "Invalid strike reason." },
          { status: 400, headers }
        );
      }
      await issueBuyerStrike(
        wallet,
        reason as StrikeAction,
        null,
        getNotificationClient()
      );
      return NextResponse.json({ success: true }, { headers });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400, headers }
    );
  } catch (error) {
    logSupabaseError("api/admin/user-actions POST", error);
    return NextResponse.json(
      { error: "Unable to apply user action." },
      { status: 500, headers }
    );
  }
}
