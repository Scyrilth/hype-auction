import { NextResponse } from "next/server";

import { logSupabaseError } from "@/lib/errors";
import { sendDirectMessageRecord } from "@/lib/messages";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";

type MessageRequestBody = {
  threadId?: unknown;
  senderWallet?: unknown;
  content?: unknown;
};

export async function POST(request: Request) {
  let body: MessageRequestBody;

  try {
    body = (await request.json()) as MessageRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const threadId = typeof body.threadId === "string" ? body.threadId.trim() : "";
  const senderWallet =
    typeof body.senderWallet === "string" ? body.senderWallet.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread is required." },
      { status: 400 }
    );
  }

  if (!senderWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400 }
    );
  }

  if (!content.trim()) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 }
    );
  }

  if (isRateLimited(senderWallet, "messages")) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  try {
    const message = await sendDirectMessageRecord(threadId, senderWallet, content);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logSupabaseError("api/messages POST", error);
    return NextResponse.json(
      { error: "Unable to send message. Please try again." },
      { status: 500 }
    );
  }
}
