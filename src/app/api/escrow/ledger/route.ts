import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
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

async function isBuyerForAuction(auctionId: string, buyerWallet: string) {
  const db = getNotificationClient();
  const { data, error } = await db
    .from("bids")
    .select("bidder_wallet, amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.bidder_wallet as string | undefined)?.trim() === buyerWallet;
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
    const threadId =
      typeof body.threadId === "string" ? body.threadId.trim() || null : null;
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

        if (!(await isBuyerForAuction(auctionId, buyerWallet))) {
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

        if (
          sellerWallet !== callerWallet ||
          sellerWallet !== parties.sellerWallet ||
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

        if (
          !escrowPda ||
          !totalLamports ||
          !onChainSignature ||
          !(await isBuyerForAuction(auctionId, callerWallet))
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
