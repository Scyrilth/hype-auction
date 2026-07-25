import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import {
  issueWalletSessionToken,
  verifyWalletSignIn,
} from "@/lib/wallet-auth";

type VerifyRequestBody = {
  wallet?: unknown;
  message?: unknown;
  signature?: unknown;
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
  let body: VerifyRequestBody;

  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
  const message = typeof body.message === "string" ? body.message : "";
  const signature =
    typeof body.signature === "string" ? body.signature.trim() : "";

  if (!wallet || !message || !signature) {
    return NextResponse.json(
      { error: "Wallet, message, and signature are required." },
      { status: 400, headers }
    );
  }

  try {
    await verifyWalletSignIn({ walletAddress: wallet, message, signature });
    const session = await issueWalletSessionToken(wallet);

    return NextResponse.json(
      {
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      { headers }
    );
  } catch (error) {
    logSupabaseError("api/auth/verify POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 401, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to verify wallet signature." },
      { status: 401, headers }
    );
  }
}
