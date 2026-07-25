import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { logSupabaseError, isSafeUserFacingMessage } from "@/lib/errors";
import { sendDirectMessageRecord } from "@/lib/messages";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { sanitizeText } from "@/lib/sanitize";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type MessageRequestBody = {
  threadId?: unknown;
  senderWallet?: unknown;
  content?: unknown;
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
  let body: MessageRequestBody;

  try {
    body = (await request.json()) as MessageRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
  const senderWallet =
    typeof body.senderWallet === "string" ? body.senderWallet.trim() : "";
  const content =
    typeof body.content === "string" ? sanitizeText(body.content) : "";

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread is required." },
      { status: 400, headers }
    );
  }

  if (!senderWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  const sessionResult = await requireWalletSession(request);
  if (!sessionResult.ok) {
    return NextResponse.json(
      { error: sessionResult.error },
      { status: sessionResult.status, headers }
    );
  }
  const walletMatch = assertWalletMatchesSession({
    session: sessionResult.session,
    claimedWallet: senderWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (!content.trim()) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400, headers }
    );
  }

  if (isRateLimited(senderWallet, "messages")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  try {
    const message = await sendDirectMessageRecord(threadId, senderWallet, content);
    return NextResponse.json({ success: true, message }, { headers });
  } catch (error) {
    logSupabaseError("api/messages POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to send message. Please try again." },
      { status: 500, headers }
    );
  }
}
