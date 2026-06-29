import { NextResponse } from "next/server";

import { checkAndEndExpiredAuctions, recoverUnfinalizedEndedAuctions } from "@/lib/auction-lifecycle";
import { corsHeaders } from "@/lib/cors";
import { checkEndingSoonNotifications } from "@/lib/notifications";

/**
 * Vercel Cron — runs every minute via vercel.json.
 *
 * Set CRON_SECRET in Vercel Environment Variables (and .env.local for manual
 * testing). Use any random string, e.g. hype-auction-cron-secret-2026.
 * Vercel sends: Authorization: Bearer <CRON_SECRET>
 */
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const endedCount = await checkAndEndExpiredAuctions();
    const recoveredCount = await recoverUnfinalizedEndedAuctions();
    await checkEndingSoonNotifications();

    return NextResponse.json(
      {
        success: true,
        endedCount,
        recoveredCount,
        timestamp: new Date().toISOString(),
      },
      { headers }
    );
  } catch (error) {
    console.error("[cron] end-auctions error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers }
    );
  }
}
