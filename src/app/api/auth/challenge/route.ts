import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import { createWalletAuthChallenge } from "@/lib/wallet-auth";

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
    new URL(request.url).searchParams.get("wallet")?.trim() ?? "";

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  try {
    const challenge = await createWalletAuthChallenge(wallet);
    return NextResponse.json(challenge, { headers });
  } catch (error) {
    logSupabaseError("api/auth/challenge GET", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to create sign-in challenge." },
      { status: 500, headers }
    );
  }
}
