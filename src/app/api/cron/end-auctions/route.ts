import { NextResponse } from "next/server";

import { checkAndEndExpiredAuctions } from "@/lib/auction-lifecycle";
import { checkEndingSoonNotifications } from "@/lib/notifications";

/**
 * Vercel Cron — runs every minute via vercel.json.
 *
 * Set CRON_SECRET in Vercel Environment Variables (and .env.local for manual
 * testing). Use any random string, e.g. hype-auction-cron-secret-2026.
 * Vercel sends: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const endedCount = await checkAndEndExpiredAuctions();
    await checkEndingSoonNotifications();

    return NextResponse.json({
      success: true,
      endedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron] end-auctions error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
