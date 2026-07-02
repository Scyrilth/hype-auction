import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { isBuyerForAuction } from "@/lib/escrow-buyer-auth";
import { logSupabaseError, isSafeUserFacingMessage } from "@/lib/errors";
import {
  logEscrowDisputeResolved,
  logEscrowFunded,
  logEscrowRefunded,
  logEscrowReleased,
  logEscrowShipped,
} from "@/lib/escrow-ledger";
import { getNotificationClient } from "@/lib/supabase";

type LedgerRequestBody = {
  type?: unknown;
  auctionId?: unknown;
  threadId?: unknown;
  buyerWallet?: unknown;
  sellerWallet?: unknown;
  escrowPda?: unknown;
  amountLamports?: unknown;
  totalLamports?: unknown;
  onChainSignature?: unknown;
  releaseToSeller?: unknown;
};

function parsePositiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

async function auctionParties(auctionId: string) {
  const db = getNotificationClient();
  const { data, error } = await db
    .from("auctions")
    .select("seller_wallet, reference_number")
    .eq("id", auctionId)
    .maybeSingle();

  if (error) throw error;
  return {
    sellerWallet: (data?.seller_wallet as string | undefined)?.trim() ?? null,
    referenceNumber: (data?.reference_number as string | undefined)?.trim() ?? null,
  };
}

async function isSellerForAuction(
  auctionId: string,
  sellerWallet: string,
  threadId?: string | null
): Promise<boolean> {
  const normalizedSeller = sellerWallet.trim();
  const parties = await auctionParties(auctionId);
  if (parties.sellerWallet === normalizedSeller) return true;

  const normalizedThreadId = threadId?.trim() ?? "";
  if (!normalizedThreadId) return false;

  const db = getNotificationClient();
  const { data: thread, error } = await db
    .from("message_threads")
    .select("seller_wallet, auction_id")
    .eq("id", normalizedThreadId)
    .maybeSingle();

  if (error) throw error;
  if (!thread) return false;

  return (
    (thread.auction_id as string | null)?.trim() === auctionId &&
    (thread.seller_wallet as string).trim() === normalizedSeller
  );
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
  let body: LedgerRequestBody;

  try {
    body = (await request.json()) as LedgerRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers }
    );
  }

  const callerWallet = request.headers.get("x-wallet-address")?.trim() ?? "";
  const auctionId =
    typeof body.auctionId === "string" ? body.auctionId.trim() : "";
  const eventType = typeof body.type === "string" ? body.type.trim() : "";
  const threadId =
    typeof body.threadId === "string" ? body.threadId.trim() || null : null;

  console.log(
    `[escrow/ledger] Ledger API called - method: POST, wallet: ${callerWallet || "(none)"}, event: ${eventType || "(none)"}, auctionId: ${auctionId || "(none)"}, threadId: ${threadId ?? "(none)"}`
  );

  if (!callerWallet) {
    return NextResponse.json(
      { error: "Wallet address is required." },
      { status: 400, headers }
    );
  }

  if (!auctionId) {
    return NextResponse.json(
      { error: "Auction is required." },
      { status: 400, headers }
    );
  }

  try {
    const onChainSignature =
      typeof body.onChainSignature === "string"
        ? body.onChainSignature.trim()
        : "";
    const { referenceNumber: auctionReferenceNumber } = await auctionParties(auctionId);

    switch (eventType) {
      case "funded": {
        const buyerWallet =
          typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
        const escrowPda =
          typeof body.escrowPda === "string" ? body.escrowPda.trim() : "";
        const amountLamports = parsePositiveInt(body.amountLamports);

        if (
          buyerWallet !== callerWallet ||
          !escrowPda ||
          !amountLamports ||
          !onChainSignature
        ) {
          return NextResponse.json({ error: "Invalid funded payload." }, { status: 400, headers });
        }

        const buyerAuthorized = await isBuyerForAuction(auctionId, buyerWallet, threadId);
        console.log(
          `[escrow/ledger] funded auth - auctionId: ${auctionId}, threadId: ${threadId ?? "(none)"}, buyerWallet: ${buyerWallet}, isBuyerForAuction: ${buyerAuthorized}`
        );

        if (!buyerAuthorized) {
          return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
        }

        await logEscrowFunded({
          auctionId,
          auctionReferenceNumber,
          threadId,
          buyerWallet,
          escrowPda,
          amountLamports,
          onChainSignature,
        });
        break;
      }
      case "shipped": {
        const sellerWallet =
          typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
        const escrowPda =
          typeof body.escrowPda === "string" ? body.escrowPda.trim() : "";
        const amountLamports = parsePositiveInt(body.amountLamports);
        const parties = await auctionParties(auctionId);
        const sellerAuthorized = await isSellerForAuction(auctionId, sellerWallet, threadId);

        console.log(
          `[escrow/ledger] shipped auth - auctionId: ${auctionId}, threadId: ${threadId ?? "(none)"}, sellerWallet: ${sellerWallet}, isSellerForAuction: ${sellerAuthorized}`
        );

        if (
          sellerWallet !== callerWallet ||
          !sellerAuthorized ||
          !escrowPda ||
          !amountLamports
        ) {
          return NextResponse.json({ error: "Invalid shipped payload." }, { status: 400, headers });
        }

        await logEscrowShipped({
          auctionId,
          auctionReferenceNumber: parties.referenceNumber ?? auctionReferenceNumber,
          threadId,
          sellerWallet,
          escrowPda,
          amountLamports,
          onChainSignature: onChainSignature || null,
        });
        break;
      }
      case "released": {
        const sellerWallet =
          typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
        const escrowPda =
          typeof body.escrowPda === "string" ? body.escrowPda.trim() : "";
        const totalLamports = parsePositiveInt(body.totalLamports);
        const buyerAuthorized = await isBuyerForAuction(auctionId, callerWallet, threadId);

        console.log(
          `[escrow/ledger] released auth - auctionId: ${auctionId}, threadId: ${threadId ?? "(none)"}, buyerWallet: ${callerWallet}, isBuyerForAuction: ${buyerAuthorized}`
        );

        if (
          !escrowPda ||
          !totalLamports ||
          !onChainSignature ||
          !buyerAuthorized
        ) {
          return NextResponse.json({ error: "Invalid released payload." }, { status: 400, headers });
        }

        await logEscrowReleased({
          auctionId,
          auctionReferenceNumber,
          threadId,
          sellerWallet,
          escrowPda,
          totalLamports,
          onChainSignature,
          buyerWallet: callerWallet,
        });
        break;
      }
      case "refunded": {
        const buyerWallet =
          typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
        const escrowPda =
          typeof body.escrowPda === "string" ? body.escrowPda.trim() : "";
        const amountLamports = parsePositiveInt(body.amountLamports);

        if (
          buyerWallet !== callerWallet ||
          !escrowPda ||
          !amountLamports ||
          !onChainSignature
        ) {
          return NextResponse.json({ error: "Invalid refunded payload." }, { status: 400, headers });
        }

        const buyerAuthorized = await isBuyerForAuction(auctionId, buyerWallet, threadId);
        console.log(
          `[escrow/ledger] refunded auth - auctionId: ${auctionId}, threadId: ${threadId ?? "(none)"}, buyerWallet: ${buyerWallet}, isBuyerForAuction: ${buyerAuthorized}`
        );

        if (!buyerAuthorized) {
          return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
        }

        await logEscrowRefunded({
          auctionId,
          auctionReferenceNumber,
          threadId,
          buyerWallet,
          escrowPda,
          amountLamports,
          onChainSignature,
        });
        break;
      }
      case "dispute_resolved": {
        const buyerWallet =
          typeof body.buyerWallet === "string" ? body.buyerWallet.trim() : "";
        const sellerWallet =
          typeof body.sellerWallet === "string" ? body.sellerWallet.trim() : "";
        const escrowPda =
          typeof body.escrowPda === "string" ? body.escrowPda.trim() : "";
        const totalLamports = parsePositiveInt(body.totalLamports);
        const releaseToSeller = body.releaseToSeller === true;

        if (
          callerWallet !== buyerWallet &&
          callerWallet !== sellerWallet
        ) {
          return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
        }

        if (!escrowPda || !totalLamports || !onChainSignature) {
          return NextResponse.json(
            { error: "Invalid dispute_resolved payload." },
            { status: 400, headers }
          );
        }

        await logEscrowDisputeResolved({
          auctionId,
          auctionReferenceNumber,
          threadId,
          buyerWallet,
          sellerWallet,
          escrowPda,
          totalLamports,
          onChainSignature,
          releaseToSeller,
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: "Unsupported ledger event type." },
          { status: 400, headers }
        );
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error(
      `[escrow/ledger] insert failed - auctionId: ${auctionId}, threadId: ${threadId ?? "(none)"}, event: ${eventType}, wallet: ${callerWallet}`,
      error
    );
    if (error && typeof error === "object") {
      console.error("[escrow/ledger] insert error details:", JSON.stringify(error, null, 2));
    }
    logSupabaseError("api/escrow/ledger POST", error);

    if (error instanceof Error && isSafeUserFacingMessage(error.message)) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: "Unable to record escrow ledger event." },
      { status: 500, headers }
    );
  }
}
