import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron-auth";
import { createPlatformEscrowProvider } from "@/lib/cron-escrow";
import { corsHeaders } from "@/lib/cors";
import { logEscrowReleased } from "@/lib/escrow-ledger";
import { autoReleaseOnChain, getEscrowPDA, PLATFORM_WALLET } from "@/lib/escrow";
import { createNotification } from "@/lib/notifications";
import { getNotificationClient } from "@/lib/supabase";

const AUTO_RELEASE_MS = 3 * 24 * 60 * 60 * 1000;

type AutoReleaseRow = {
  id: string;
  title: string | null;
  seller_wallet: string | null;
  escrow_pda: string | null;
  escrow_amount_lamports: number | null;
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
  const shippedBeforeIso = new Date(Date.now() - AUTO_RELEASE_MS).toISOString();
  const results: Array<{
    auctionId: string;
    success: boolean;
    txSignature?: string;
    error?: string;
  }> = [];

  try {
    const { data: rows, error: queryError } = await db
      .from("auctions")
      .select("id, title, seller_wallet, escrow_pda, escrow_amount_lamports")
      .eq("escrow_state", "shipped")
      .eq("status", "ended")
      .lt("shipped_at", shippedBeforeIso);

    if (queryError) {
      console.error("[cron] auto-release query failed:", queryError);
      return NextResponse.json(
        { error: "Query failed" },
        { status: 500, headers }
      );
    }

    const auctions = (rows ?? []) as AutoReleaseRow[];
    if (!auctions.length) {
      return NextResponse.json(
        { success: true, processed: 0, results, timestamp: nowIso },
        { headers }
      );
    }

    const provider = createPlatformEscrowProvider();

    for (const auction of auctions) {
      const auctionId = auction.id;
      const sellerWallet = auction.seller_wallet?.trim();
      if (!sellerWallet) {
        results.push({
          auctionId,
          success: false,
          error: "Missing seller wallet",
        });
        continue;
      }

      try {
        const onChainResult = await autoReleaseOnChain(
          auctionId,
          sellerWallet,
          PLATFORM_WALLET,
          provider
        );

        if (!onChainResult.success) {
          results.push({
            auctionId,
            success: false,
            error: onChainResult.error,
          });
          console.error("[cron] auto-release on-chain failed:", {
            auctionId,
            error: onChainResult.error,
          });
          continue;
        }

        const { error: auctionUpdateError } = await db
          .from("auctions")
          .update({
            escrow_state: "complete",
            status: "completed",
            shipping_status: "delivered",
          })
          .eq("id", auctionId);

        if (auctionUpdateError) {
          throw auctionUpdateError;
        }

        const { data: threadRows, error: threadQueryError } = await db
          .from("message_threads")
          .select("id, buyer_wallet")
          .eq("auction_id", auctionId)
          .eq("seller_wallet", sellerWallet)
          .order("created_at", { ascending: false })
          .limit(1);

        if (threadQueryError) {
          throw threadQueryError;
        }

        const thread = threadRows?.[0] as
          | { id: string; buyer_wallet: string }
          | undefined;
        const threadId = thread?.id ?? null;
        const buyerWallet = thread?.buyer_wallet?.trim() ?? null;
        const itemTitle = auction.title?.trim() || "your item";
        const link = threadId ? `/messages/${threadId}` : null;

        if (threadId) {
          const { error: threadUpdateError } = await db
            .from("message_threads")
            .update({ escrow_status: "complete" })
            .eq("id", threadId);

          if (threadUpdateError) {
            throw threadUpdateError;
          }
        }

        const escrowPda =
          auction.escrow_pda?.trim() || getEscrowPDA(auctionId)[0].toBase58();
        const totalLamports = Number(auction.escrow_amount_lamports ?? 0);

        if (buyerWallet && totalLamports > 0) {
          await logEscrowReleased({
            auctionId,
            threadId,
            sellerWallet,
            escrowPda,
            totalLamports,
            onChainSignature: onChainResult.txSignature,
            buyerWallet,
          });
        }

        if (buyerWallet) {
          await createNotification(
            buyerWallet,
            "transaction_complete",
            "Transaction complete",
            `Funds were automatically released to the seller for ${itemTitle} after 3 days.`,
            link,
            db
          );
        }

        await createNotification(
          sellerWallet,
          "funds_released",
          "Funds released! 💰",
          `Your payment for ${itemTitle} has been automatically released to your wallet.`,
          link,
          db
        );

        results.push({
          auctionId,
          success: true,
          txSignature: onChainResult.txSignature,
        });
        console.log("[cron] auto-release success:", {
          auctionId,
          txSignature: onChainResult.txSignature,
        });
      } catch (auctionError) {
        const message =
          auctionError instanceof Error
            ? auctionError.message
            : "Unknown error";
        results.push({ auctionId, success: false, error: message });
        console.error("[cron] auto-release auction failed:", {
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
    console.error("[cron] auto-release error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers }
    );
  }
}
