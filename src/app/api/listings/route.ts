import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import type { ListingType } from "@/lib/database.types";
import { logSupabaseError } from "@/lib/errors";
import { notifyListingLive } from "@/lib/notifications";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { sanitizeText } from "@/lib/sanitize";
import { createAuction } from "@/lib/seller";
import {
  assertWalletMatchesSession,
  requireWalletSession,
} from "@/lib/wallet-auth";

type ListingRequestBody = {
  sellerWallet?: unknown;
  title?: unknown;
  description?: unknown;
  category?: unknown;
  condition?: unknown;
  startPrice?: unknown;
  durationHours?: unknown;
  imageUrl?: unknown;
  additionalImages?: unknown;
  itemDetails?: unknown;
  domesticShippingUsd?: unknown;
  internationalShippingUsd?: unknown;
  listingType?: unknown;
  buyNowPrice?: unknown;
  goodTillCancelled?: unknown;
};

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function parseListingType(value: unknown): ListingType {
  if (
    value === "auction" ||
    value === "auction_buy_now" ||
    value === "fixed_price"
  ) {
    return value;
  }
  return "auction";
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
  let body: ListingRequestBody;

  try {
    body = (await request.json()) as ListingRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
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

  if (await isRateLimited(sellerWallet, "listings")) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers }
    );
  }

  const title =
    typeof body.title === "string" ? sanitizeText(body.title) : "";
  const description =
    typeof body.description === "string" ? sanitizeText(body.description) : "";
  const category = typeof body.category === "string" ? body.category : "";
  const condition = typeof body.condition === "string" ? body.condition : "";
  const startPrice = parseNumber(body.startPrice);
  const durationHours = parseNumber(body.durationHours);
  const listingType = parseListingType(body.listingType);
  const buyNowPrice = parseNumber(body.buyNowPrice);
  const goodTillCancelled = Boolean(body.goodTillCancelled);
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;
  const additionalImages = Array.isArray(body.additionalImages)
    ? body.additionalImages.filter((item): item is string => typeof item === "string")
    : [];
  const itemDetails =
    body.itemDetails &&
    typeof body.itemDetails === "object" &&
    !Array.isArray(body.itemDetails)
      ? (body.itemDetails as Record<string, string>)
      : {};

  if (!title.trim()) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400, headers }
    );
  }

  if (!category) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400, headers }
    );
  }

  if (!condition) {
    return NextResponse.json(
      { error: "Condition is required." },
      { status: 400, headers }
    );
  }

  const isFixedPrice = listingType === "fixed_price";
  const isAuctionBuyNow = listingType === "auction_buy_now";

  if (!isFixedPrice) {
    if (!Number.isFinite(startPrice) || startPrice <= 0) {
      return NextResponse.json(
        { error: "Start price must be a positive number." },
        { status: 400, headers }
      );
    }
  }

  if (isAuctionBuyNow || isFixedPrice) {
    if (!Number.isFinite(buyNowPrice) || buyNowPrice <= 0) {
      return NextResponse.json(
        { error: "Buy Now price must be a positive number." },
        { status: 400, headers }
      );
    }
    if (isAuctionBuyNow && buyNowPrice <= startPrice) {
      return NextResponse.json(
        { error: "Buy Now price must be higher than the starting bid." },
        { status: 400, headers }
      );
    }
  }

  if (!goodTillCancelled) {
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return NextResponse.json(
        { error: "Duration must be a positive number." },
        { status: 400, headers }
      );
    }
  } else if (!isFixedPrice) {
    return NextResponse.json(
      { error: "Good Till Cancelled is only available for fixed price listings." },
      { status: 400, headers }
    );
  }

  try {
    const auction = await createAuction({
      sellerWallet,
      title,
      description,
      category,
      condition,
      startPrice: isFixedPrice ? buyNowPrice : startPrice,
      durationHours: goodTillCancelled ? 168 : durationHours,
      imageUrl,
      additionalImages,
      itemDetails,
      domesticShippingUsd: parseNumber(body.domesticShippingUsd) || 0,
      internationalShippingUsd: parseNumber(body.internationalShippingUsd) || 0,
      listingType,
      buyNowPrice: isAuctionBuyNow || isFixedPrice ? buyNowPrice : null,
      goodTillCancelled,
    });

    try {
      await notifyListingLive({
        sellerWallet,
        auctionTitle: title.trim(),
        categoryLabel: category,
        auctionId: auction.id,
      });
    } catch (notifyError) {
      logSupabaseError("api/listings POST:notifyListingLive", notifyError);
    }

    return NextResponse.json({ success: true, auction }, { headers });
  } catch (error) {
    logSupabaseError("api/listings POST", error);
    return NextResponse.json(
      { error: "Unable to create listing. Please try again." },
      { status: 500, headers }
    );
  }
}
