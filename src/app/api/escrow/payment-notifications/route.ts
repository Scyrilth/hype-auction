import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { logSupabaseError, isSafeUserFacingMessage } from "@/lib/errors";
import { getAuctionThreadId, insertThreadSystemMessage } from "@/lib/messages";
import { notifyPaymentConfirmed } from "@/lib/notifications";
import { formatSol } from "@/lib/format";
import { getNotificationClient } from "@/lib/supabase";

type PaymentNotificationRequestBody = {
  auctionId?: unknown;
  buyerWallet?: unknown;
  sellerWallet?: unknown;
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
  const buyerWallet =
    typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
  const sellerWallet =
    typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
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

  if (!callerWallet || callerWallet !== buyerWallet) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
  }

  if (!auctionId || !buyerWallet || !sellerWallet) {
    return NextResponse.json(
      { error: "Auction, buyer, and seller are required." },
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
    const resolvedThreadId =
      threadId ?? (await getAuctionThreadId(auctionId, buyerWallet));

    const { data: auctionRow, error: auctionError } = await db
      .from("auctions")
      .select("title, seller_wallet")
      .eq("id", auctionId)
      .maybeSingle();

    if (auctionError) throw auctionError;
    if (!auctionRow?.title) {
      return NextResponse.json(
        { error: "Auction not found." },
        { status: 404, headers }
      );
    }

    if ((auctionRow.seller_wallet as string).trim() !== sellerWallet) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
    }

    if (!resolvedThreadId) {
      console.error(
        `[escrow/payment-notifications] missing thread - auctionId: ${auctionId}, buyerWallet: ${buyerWallet}`
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
        buyerWallet,
        db
      );
    } catch (systemMessageError) {
      console.error(
        "[escrow/payment-notifications] system message failed:",
        systemMessageError
      );
    }

    await notifyPaymentConfirmed({
      buyerWallet,
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
