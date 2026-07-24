import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron-auth";
import { loadPlatformKeypair } from "@/lib/platform-keypair";

/**
 * TEMPORARY diagnostic route — delete once PLATFORM_KEYPAIR_JSON is confirmed
 * in production. Do not leave this endpoint deployed long-term.
 *
 * GET /api/cron/diagnose-platform-key
 * Authorization: Bearer <CRON_SECRET>
 *
 * Returns only { keyLoads, matchesExpected }. Never returns key material.
 */
const EXPECTED_PLATFORM_PUBLIC_KEY =
  "92eHN29Kq1m2jChYM7WvdcA3BdUNigxq6NYWK7XyYJeB";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keypair = loadPlatformKeypair();
    const derived = keypair.publicKey.toBase58();
    const matchesExpected = derived === EXPECTED_PLATFORM_PUBLIC_KEY;

    return NextResponse.json({
      keyLoads: true,
      matchesExpected,
    });
  } catch {
    return NextResponse.json({
      keyLoads: false,
      matchesExpected: false,
    });
  }
}
