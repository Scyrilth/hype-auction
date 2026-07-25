import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isBuyerForAuction } from "@/lib/escrow-buyer-auth";
import { logSupabaseError, isSafeUserFacingMessage } from "@/lib/errors";
import { getAuctionThreadId, insertThreadSystemMessage } from "@/lib/messages";
import { notifyPaymentConfirmed } from "@/lib/notifications";
import { formatSol } from "@/lib/format";
import { getNotificationClient } from "@/lib/supabase";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type PaymentNotificationRequestBody = {
  auctionId?: unknown;
  threadId?: unknown;
  totalSol?: unknown;
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
  let body: PaymentNotificationRequestBody;

  try {
    body = (await request.json()) as PaymentNotificationRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const callerWallet = request.headers.get("x-wallet-address")?.trim() ?? "";
  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const threadId =
    typeof body.threadId === "string" ? body.threadId.trim() || null : null;
  const totalSol =
    typeof body.totalSol === "number"
      ? body.totalSol
      : typeof body.totalSol === "string"
        ? Number(body.totalSol)
        : NaN;

  console.log(
    `[escrow/payment-notifications] called - wallet: ${callerWallet || "(none)"}, auctionId: ${auctionId || "(none)"}, threadId: ${threadId ?? "(none)"}`
  );

  if (!callerWallet) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
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
    claimedWallet: callerWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (!auctionId) {
    return NextResponse.json(
      { error: "Auction is required." },
      { status: 400, headers }
    );
  }

  if (!Number.isFinite(totalSol) || totalSol <= 0) {
    return NextResponse.json(
      { error: "totalSol must be a positive number." },
      { status: 400, headers }
    );
  }

  try {
    const db = getNotificationClient();

    const { data: auctionRow, error: auctionError } = await db
      .from("auctions")
      .select("title, seller_wallet, escrow_state, escrow_funded")
      .eq("id", auctionId)
      .maybeSingle();

    if (auctionError) throw auctionError;
    if (!auctionRow?.title) {
      return NextResponse.json(
        { error: "Auction not found." },
        { status: 404, headers }
      );
    }

    const escrowState = (auctionRow.escrow_state as string | null)?.trim() ?? "";
    if (escrowState !== "funded" || !auctionRow.escrow_funded) {
      console.log(
        `[escrow/payment-notifications] rejected - auctionId: ${auctionId}, escrow_state: ${escrowState || "(none)"}, escrow_funded: ${Boolean(auctionRow.escrow_funded)}`
      );
      return NextResponse.json(
        { error: "Auction escrow is not in funded state." },
        { status: 403, headers }
      );
    }

    const sellerWallet = (auctionRow.seller_wallet as string).trim();
    if (!sellerWallet) {
      return NextResponse.json(
        { error: "Auction seller not found." },
        { status: 404, headers }
      );
    }

    const resolvedThreadId =
      threadId ?? (await getAuctionThreadId(auctionId, callerWallet));

    const buyerAuthorized = await isBuyerForAuction(
      auctionId,
      callerWallet,
      threadId ?? resolvedThreadId
    );
    console.log(
      `[escrow/payment-notifications] buyer auth - auctionId: ${auctionId}, buyerWallet: ${callerWallet}, isBuyerForAuction: ${buyerAuthorized}`
    );
    if (!buyerAuthorized) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
    }

    if (!resolvedThreadId) {
      console.error(
        `[escrow/payment-notifications] missing thread - auctionId: ${auctionId}, buyerWallet: ${callerWallet}`
      );
      return NextResponse.json(
        { error: "Message thread not found for this auction." },
        { status: 404, headers }
      );
    }

    const auctionTitle = auctionRow.title as string;

    try {
      await insertThreadSystemMessage(
        resolvedThreadId,
        `💰 Payment secured in escrow. ${formatSol(totalSol)} locked for ${auctionTitle}.`,
        callerWallet,
        db
      );
    } catch (systemMessageError) {
      console.error(
        "[escrow/payment-notifications] system message failed:",
        systemMessageError
      );
    }

    await notifyPaymentConfirmed({
      buyerWallet: callerWallet,
      sellerWallet,
      auctionTitle,
      threadId: resolvedThreadId,
      totalSol,
    });

    const { error: threadEscrowError } = await db
      .from("message_threads")
      .update({ escrow_status: "funded" })
      .eq("id", resolvedThreadId);

    if (threadEscrowError) {
      console.error(
        "[escrow/payment-notifications] thread escrow_status update failed:",
        threadEscrowError
      );
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    logSupabaseError("api/escrow/payment-notifications POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to send payment notifications." },
      { status: 500, headers }
    );
  }
}
