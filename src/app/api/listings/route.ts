import { NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { logSupabaseError } from "@/lib/errors";
import { notifyListingLive } from "@/lib/notifications";
import { isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limiter";
import { sanitizeText } from "@/lib/sanitize";
import { createAuction } from "@/lib/seller";

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
};

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
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

  if (isRateLimited(sellerWallet, "listings")) {
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

  if (!Number.isFinite(startPrice) || startPrice <= 0) {
    return NextResponse.json(
      { error: "Start price must be a positive number." },
      { status: 400, headers }
    );
  }

  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return NextResponse.json(
      { error: "Duration must be a positive number." },
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
      startPrice,
      durationHours,
      imageUrl,
      additionalImages,
      itemDetails,
      domesticShippingUsd: parseNumber(body.domesticShippingUsd) || 0,
      internationalShippingUsd: parseNumber(body.internationalShippingUsd) || 0,
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
