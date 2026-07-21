import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron-auth";
import { corsHeaders } from "@/lib/cors";
import { notifyShipReminder } from "@/lib/notifications";
import { getNotificationClient } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

type ShipReminderRow = {
  id: string;
  title: string | null;
  seller_wallet: string | null;
};

async function resolveSellerThreadLink(
  db: ReturnType<typeof getNotificationClient>,
  auctionId: string,
  sellerWallet: string
): Promise<string> {
  const { data, error } = await db
    .from("message_threads")
    .select("id")
    .eq("auction_id", auctionId)
    .eq("seller_wallet", sellerWallet)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[cron] ship-reminder thread lookup failed:", {
      auctionId,
      error,
    });
    return "/dashboard";
  }

  const threadId = data?.id as string | undefined;
  return threadId ? `/messages/${threadId}` : "/dashboard";
}

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
  const twoDaysAgoIso = new Date(Date.now() - 2 * DAY_MS).toISOString();
  const fiveDaysAgoIso = new Date(Date.now() - 5 * DAY_MS).toISOString();
  const results: Array<{
    auctionId: string;
    success: boolean;
    error?: string;
  }> = [];

  try {
    const { data: rows, error: queryError } = await db
      .from("auctions")
      .select("id, title, seller_wallet")
      .eq("status", "ended")
      .eq("escrow_state", "funded")
      .eq("ship_reminder_sent", false)
      .eq("is_dummy", false)
      .not("payment_completed_at", "is", null)
      .gte("payment_completed_at", fiveDaysAgoIso)
      .lte("payment_completed_at", twoDaysAgoIso)
      .or("tracking_number.is.null,tracking_number.eq.");

    if (queryError) {
      console.error("[cron] ship-reminder query failed:", queryError);
      return NextResponse.json(
        { error: "Query failed" },
        { status: 500, headers }
      );
    }

    const auctions = (rows ?? []) as ShipReminderRow[];
    if (!auctions.length) {
      return NextResponse.json(
        { success: true, processed: 0, results, timestamp: nowIso },
        { headers }
      );
    }

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
        const title = auction.title?.trim() || "your item";
        const link = await resolveSellerThreadLink(db, auctionId, sellerWallet);

        await notifyShipReminder({
          sellerWallet,
          auctionTitle: title,
          link,
          client: db,
        });

        const { data: updated, error: updateError } = await db
          .from("auctions")
          .update({ ship_reminder_sent: true })
          .eq("id", auctionId)
          .eq("ship_reminder_sent", false)
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updated) {
          results.push({
            auctionId,
            success: false,
            error: "Reminder already sent",
          });
          continue;
        }

        results.push({ auctionId, success: true });
        console.log("[cron] ship-reminder sent:", { auctionId, sellerWallet });
      } catch (auctionError) {
        const message =
          auctionError instanceof Error
            ? auctionError.message
            : "Unknown error";
        results.push({ auctionId, success: false, error: message });
        console.error("[cron] ship-reminder auction failed:", {
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
    console.error("[cron] ship-reminder error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers }
    );
  }
}
