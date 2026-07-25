import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isSafeUserFacingMessage, logSupabaseError } from "@/lib/errors";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import {
  createShipmentGroup,
  dismissBundleRefundNudge,
  finalizeShipmentGroupTracking,
  recordBundleRefundSent,
} from "@/lib/shipment-groups";
import { getAuthenticatedClient } from "@/lib/supabase";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type ShipmentGroupRequestBody = {
  action?: unknown;
  sellerWallet?: unknown;
  auctionIds?: unknown;
  groupId?: unknown;
  carrier?: unknown;
  trackingNumber?: unknown;
  txSignature?: unknown;
  solAmount?: unknown;
};

const VALID_ACTIONS = new Set([
  "create",
  "finalize-tracking",
  "record-refund",
  "dismiss-refund-nudge",
]);

function parseAction(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "create";
  }
  if (typeof value !== "string") {
    return "__invalid__";
  }
  const trimmed = value.trim();
  if (!trimmed) return "create";
  return VALID_ACTIONS.has(trimmed) ? trimmed : "__invalid__";
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  let body: ShipmentGroupRequestBody;

  try {
    body = (await request.json()) as ShipmentGroupRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const action = parseAction(body.action);
  if (action === "__invalid__") {
    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400, headers }
    );
  }

  const sellerWallet =
    typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";

  if (!sellerWallet) {
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
    claimedWallet: sellerWallet,
  });
  if (!walletMatch.ok) {
    return NextResponse.json(
      { error: walletMatch.error },
      { status: walletMatch.status, headers }
    );
  }

  if (isRateLimited(sellerWallet, "messages")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  if (action === "finalize-tracking") {
    const groupId =
      typeof body.groupId === "string" ? body.groupId.trim() : "";
    const carrier =
      typeof body.carrier === "string" ? body.carrier.trim() : "";
    const trackingNumber =
      typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";

    if (!groupId) {
      return NextResponse.json(
        { error: "Bundle is required." },
        { status: 400, headers }
      );
    }

    try {
      const client = getAuthenticatedClient(sellerWallet);
      const group = await finalizeShipmentGroupTracking({
        groupId,
        sellerWallet,
        carrier,
        trackingNumber,
        client,
      });

      return NextResponse.json(
        {
          success: true,
          groupId: group.id,
          bundleReference: group.bundle_reference,
        },
        { headers }
      );
    } catch (error) {
      logSupabaseError("api/seller/shipment-groups finalize-tracking", error);

      if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
        return NextResponse.json(
          { error: error.message },
          { status: 400, headers }
        );
      }

      return NextResponse.json(
        { error: "Unable to save bundle tracking. Please try again." },
        { status: 500, headers }
      );
    }
  }

  if (action === "record-refund") {
    const groupId =
      typeof body.groupId === "string" ? body.groupId.trim() : "";
    const txSignature =
      typeof body.txSignature === "string" ? body.txSignature.trim() : "";
    const solAmount =
      typeof body.solAmount === "number"
        ? body.solAmount
        : typeof body.solAmount === "string"
          ? Number(body.solAmount)
          : NaN;

    if (!groupId) {
      return NextResponse.json(
        { error: "Bundle is required." },
        { status: 400, headers }
      );
    }

    if (!txSignature) {
      return NextResponse.json(
        { error: "Transaction signature is required." },
        { status: 400, headers }
      );
    }

    try {
      const client = getAuthenticatedClient(sellerWallet);
      const group = await recordBundleRefundSent({
        groupId,
        sellerWallet,
        txSignature,
        solAmount,
        client,
      });

      return NextResponse.json(
        {
          success: true,
          groupId: group.id,
          bundleReference: group.bundle_reference,
        },
        { headers }
      );
    } catch (error) {
      logSupabaseError("api/seller/shipment-groups record-refund", error);

      if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
        return NextResponse.json(
          { error: error.message },
          { status: 400, headers }
        );
      }

      return NextResponse.json(
        { error: "Unable to record refund. Please try again." },
        { status: 500, headers }
      );
    }
  }

  if (action === "dismiss-refund-nudge") {
    const groupId =
      typeof body.groupId === "string" ? body.groupId.trim() : "";

    if (!groupId) {
      return NextResponse.json(
        { error: "Bundle is required." },
        { status: 400, headers }
      );
    }

    try {
      const client = getAuthenticatedClient(sellerWallet);
      const group = await dismissBundleRefundNudge({
        groupId,
        sellerWallet,
        client,
      });

      return NextResponse.json(
        {
          success: true,
          groupId: group.id,
          bundleReference: group.bundle_reference,
        },
        { headers }
      );
    } catch (error) {
      logSupabaseError("api/seller/shipment-groups dismiss-refund-nudge", error);

      if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
        return NextResponse.json(
          { error: error.message },
          { status: 400, headers }
        );
      }

      return NextResponse.json(
        { error: "Unable to dismiss refund nudge. Please try again." },
        { status: 500, headers }
      );
    }
  }

  const auctionIds = Array.isArray(body.auctionIds)
    ? body.auctionIds.filter((id): id is string => typeof id === "string")
    : [];

  if (auctionIds.length < 2) {
    return NextResponse.json(
      { error: "Select at least two orders to bundle." },
      { status: 400, headers }
    );
  }

  try {
    const client = getAuthenticatedClient(sellerWallet);
    const result = await createShipmentGroup({
      sellerWallet,
      auctionIds,
      client,
    });

    return NextResponse.json(
      {
        success: true,
        groupId: result.group.id,
        bundleReference: result.group.bundle_reference,
        auctionIds: result.auctionIds,
      },
      { headers }
    );
  } catch (error) {
    logSupabaseError("api/seller/shipment-groups create", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to create bundle. Please try again." },
      { status: 500, headers }
    );
  }
}
