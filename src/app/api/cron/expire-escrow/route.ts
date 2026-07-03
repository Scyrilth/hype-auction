import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron-auth";
import { createPlatformEscrowProvider } from "@/lib/cron-escrow";
import { corsHeaders } from "@/lib/cors";
import { expireEscrowOnChain } from "@/lib/escrow";
import { getAuctionThreadId } from "@/lib/messages";
import { createNotification } from "@/lib/notifications";
import { getNotificationClient } from "@/lib/supabase";

type ExpireEscrowRow = {
  id: string;
  title: string | null;
  next_bidder_wallet: string | null;
};

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  const db = getNotificationClient();
  const nowIso = new Date().toISOString();
  const results: Array<{
    auctionId: string;
    success: boolean;
    txSignature?: string;
    error?: string;
  }> = [];

  try {
    const { data: rows, error: queryError } = await db
      .from("auctions")
      .select("id, title, next_bidder_wallet")
      .eq("escrow_state", "pending")
      .eq("status", "ended")
      .lt("payment_deadline", nowIso);

    if (queryError) {
      console.error("[cron] expire-escrow query failed:", queryError);
      return NextResponse.json(
        { error: "Query failed" },
        { status: 500, headers }
      );
    }

    const auctions = (rows ?? []) as ExpireEscrowRow[];
    if (!auctions.length) {
      return NextResponse.json(
        { success: true, processed: 0, results, timestamp: nowIso },
        { headers }
      );
    }

    const provider = createPlatformEscrowProvider();

    for (const auction of auctions) {
      const auctionId = auction.id;
      try {
        const onChainResult = await expireEscrowOnChain(auctionId, provider);
        if (!onChainResult.success) {
          results.push({
            auctionId,
            success: false,
            error: onChainResult.error,
          });
          console.error("[cron] expire-escrow on-chain failed:", {
            auctionId,
            error: onChainResult.error,
          });
          continue;
        }

        const { error: updateError } = await db
          .from("auctions")
          .update({
            escrow_state: "expired",
            escrow_expired_at: nowIso,
          })
          .eq("id", auctionId);

        if (updateError) {
          throw updateError;
        }

        const nextBidderWallet = auction.next_bidder_wallet?.trim();
        if (nextBidderWallet) {
          const threadId = await getAuctionThreadId(auctionId, nextBidderWallet);
          const link = threadId ? `/messages/${threadId}` : `/auction/${auctionId}`;
          const title = auction.title?.trim() || "this auction";

          await createNotification(
            nextBidderWallet,
            "next_bidder_offer",
            "Payment window expired — your turn",
            `The previous winner did not pay in time for ${title}. Complete payment using Pay Now in your message thread.`,
            link,
            db
          );
        }

        results.push({
          auctionId,
          success: true,
          txSignature: onChainResult.txSignature,
        });
        console.log("[cron] expire-escrow success:", {
          auctionId,
          txSignature: onChainResult.txSignature,
        });
      } catch (auctionError) {
        const message =
          auctionError instanceof Error
            ? auctionError.message
            : "Unknown error";
        results.push({ auctionId, success: false, error: message });
        console.error("[cron] expire-escrow auction failed:", {
          auctionId,
          error: auctionError,
        });
      }
    }

    const successCount = results.filter((row) => row.success).length;
    return NextResponse.json(
      {
        success: true,
        processed: auctions.length,
        successCount,
        results,
        timestamp: nowIso,
      },
      { headers }
    );
  } catch (error) {
    console.error("[cron] expire-escrow error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers }
    );
  }
}
