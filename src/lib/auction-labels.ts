import type { Auction } from "@/lib/database.types";

export type AuctionLabelId =
  | "ENDING_SOON"
  | "FEATURED"
  | "HIGH_VALUE"
  | "HOT"
  | "RARE"
  | "COLLECTOR"
  | "VINTAGE"
  | "NEW"
  | "FIXED_PRICE";

const LABEL_PRIORITY: AuctionLabelId[] = [
  "FIXED_PRICE",
  "ENDING_SOON",
  "FEATURED",
  "HIGH_VALUE",
  "HOT",
  "RARE",
  "COLLECTOR",
  "VINTAGE",
  "NEW",
];

const COLLECTOR_CATEGORIES = new Set([
  "Trading Cards",
  "Coins & Currency",
  "Sports Memorabilia",
  "Art",
  "Collectibles",
]);

const RARE_EDITION_MARKERS = [
  "1st Edition",
  "Limited Edition",
  "Artist Proof",
  "Convention Exclusive",
  "Prototype",
];

export interface AuctionLabelMaps {
  bidCounts?: Map<string, number>;
  bidCounts24h?: Map<string, number>;
  topFeaturedIds?: Set<string>;
}

export function getAuctionCardLabelProps(
  auctionId: string,
  labelMaps?: AuctionLabelMaps,
  bidCount24h?: number
) {
  const bidCount = labelMaps?.bidCounts?.get(auctionId);
  const resolvedBidCount24h =
    bidCount24h ?? labelMaps?.bidCounts24h?.get(auctionId);

  return {
    bidCount: typeof bidCount === "number" ? bidCount : undefined,
    bidCount24h:
      typeof resolvedBidCount24h === "number" ? resolvedBidCount24h : undefined,
    isTopFeaturedByBids: labelMaps?.topFeaturedIds?.has(auctionId) ?? false,
  };
}

export interface AuctionLabelInput {
  auction: Pick<
    Auction,
    | "id"
    | "current_bid"
    | "start_price"
    | "end_time"
    | "created_at"
    | "category"
    | "item_details"
    | "status"
  > & {
    is_featured?: boolean;
    listing_type?: string;
  };
  bidCount?: number;
  bidCount24h?: number;
  isTopFeaturedByBids?: boolean;
  now?: number;
}

function getDisplayBid(auction: AuctionLabelInput["auction"]) {
  return auction.current_bid > 0 ? auction.current_bid : auction.start_price;
}

function parseDetailNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeGradingCompany(company: string | undefined): string {
  const normalized = (company ?? "").trim().toUpperCase();
  if (normalized === "BECKETT" || normalized === "BGS (BECKETT)") return "BGS";
  return normalized;
}

function isRareGrading(details: Record<string, string>): boolean {
  const company = normalizeGradingCompany(details.grading_company);
  const grade = (details.grade ?? "").trim();
  const gradeUpper = grade.toUpperCase();
  const label = details.grade_label ?? "";

  switch (company) {
    case "PSA":
      return ["9", "9.5", "10"].includes(grade);
    case "BGS":
      if (grade === "10" && /black label/i.test(label)) return true;
      return ["9", "9.5", "10"].includes(grade);
    case "CGC":
      if (grade === "10" && /pristine/i.test(label)) return true;
      return ["9", "9.5", "10"].includes(grade);
    case "SGC":
      return ["9", "9.5", "10"].includes(grade);
    case "ACE":
      if (grade === "10" && /pristine/i.test(label)) return true;
      return ["9", "10"].includes(grade);
    case "HGA":
      return ["9", "9.5", "10"].includes(grade);
    case "PCGS":
      return ["MS68", "MS69", "MS70", "PR69", "PR70"].includes(gradeUpper);
    case "NGC":
      return ["MS68", "MS69", "MS70", "PR69", "PR70"].includes(gradeUpper);
    default:
      return false;
  }
}

function isRareEdition(details: Record<string, string>): boolean {
  const edition = details.edition ?? "";
  return RARE_EDITION_MARKERS.some((marker) => edition.includes(marker));
}

function isRare(details: Record<string, string>): boolean {
  if (isRareGrading(details)) return true;
  if (isRareEdition(details)) return true;
  if (details.print_number?.trim()) return true;

  const year = parseDetailNumber(details.year);
  if (details.pressing === "Original" && year !== null && year < 1970) {
    return true;
  }

  const mintage = parseDetailNumber(details.mintage);
  if (mintage !== null && mintage < 1000) return true;

  const rarityRank = parseDetailNumber(details.rarity_rank);
  if (rarityRank !== null && rarityRank < 500) return true;

  if (details.completeness === "Sealed" && year !== null && year < 2000) {
    return true;
  }

  const authentication = details.authentication?.trim();
  if (authentication && authentication !== "None") return true;

  return false;
}

function isCollectorItem(
  category: string | null | undefined,
  details: Record<string, string>
): boolean {
  if (!category || !COLLECTOR_CATEGORIES.has(category)) return false;
  return Boolean(details.grading_company?.trim());
}

function isVintage(details: Record<string, string>): boolean {
  const year = parseDetailNumber(details.year);
  return year !== null && year < 1990;
}

function isNewListing(createdAt: string, now: number): boolean {
  const created = new Date(createdAt).getTime();
  return now - created <= 24 * 60 * 60 * 1000;
}

function isEndingSoon(endTime: string, now: number, status: string): boolean {
  if (status !== "live") return false;
  const end = new Date(endTime).getTime();
  return end > now && end - now < 60 * 60 * 1000;
}

function resolveBidCount(bidCount?: number, bidCount24h?: number): number | null {
  const hasBidCount = typeof bidCount === "number";
  const hasBidCount24h = typeof bidCount24h === "number";

  if (hasBidCount && hasBidCount24h) {
    return Math.max(bidCount, bidCount24h);
  }
  if (hasBidCount) return bidCount;
  if (hasBidCount24h) return bidCount24h;
  return null;
}

/** Normalize auction fields required by label rules. */
export function createAuctionLabelInput(
  auction: AuctionLabelInput["auction"],
  options: Omit<AuctionLabelInput, "auction"> = {}
): AuctionLabelInput {
  return {
    auction: {
      id: auction.id,
      current_bid: Number(auction.current_bid ?? 0),
      start_price: Number(auction.start_price ?? 0),
      end_time: auction.end_time,
      created_at: auction.created_at,
      category: auction.category ?? null,
      item_details: auction.item_details ?? {},
      status: auction.status,
      is_featured: Boolean(auction.is_featured),
      listing_type: (auction as { listing_type?: string }).listing_type,
    },
    bidCount: options.bidCount,
    bidCount24h: options.bidCount24h,
    isTopFeaturedByBids: options.isTopFeaturedByBids,
    now: options.now,
  };
}

export function getTopFeaturedAuctionIds(
  items: { id: string; bidCount24h: number }[]
): Set<string> {
  return new Set(
    [...items]
      .sort((a, b) => b.bidCount24h - a.bidCount24h)
      .slice(0, 3)
      .map((item) => item.id)
  );
}

export function getAuctionLabels(input: AuctionLabelInput): AuctionLabelId[] {
  const normalized = createAuctionLabelInput(input.auction, {
    bidCount: input.bidCount,
    bidCount24h: input.bidCount24h,
    isTopFeaturedByBids: input.isTopFeaturedByBids,
    now: input.now,
  });
  const { auction, bidCount, bidCount24h, isTopFeaturedByBids } = normalized;
  const now = normalized.now ?? Date.now();
  const details = auction.item_details ?? {};
  const matched = new Set<AuctionLabelId>();
  const resolvedBidCount = resolveBidCount(bidCount, bidCount24h);

  if (auction.listing_type === "fixed_price") {
    matched.add("FIXED_PRICE");
  }

  if (isEndingSoon(auction.end_time, now, auction.status)) {
    matched.add("ENDING_SOON");
  }

  if (auction.is_featured || isTopFeaturedByBids) {
    matched.add("FEATURED");
  }

  if (getDisplayBid(auction) > 10) {
    matched.add("HIGH_VALUE");
  }

  if (resolvedBidCount !== null && resolvedBidCount > 5) {
    matched.add("HOT");
  }

  if (isRare(details)) {
    matched.add("RARE");
  }

  if (isCollectorItem(auction.category, details)) {
    matched.add("COLLECTOR");
  }

  if (isVintage(details)) {
    matched.add("VINTAGE");
  }

  if (isNewListing(auction.created_at, now)) {
    matched.add("NEW");
  }

  const labels = LABEL_PRIORITY.filter((label) => matched.has(label)).slice(0, 2);

  console.log("[getAuctionLabels]", {
    auctionId: auction.id,
    inputs: {
      end_time: auction.end_time,
      current_bid: auction.current_bid,
      bid_count: bidCount,
      bidCount24h,
      created_at: auction.created_at,
      item_details: auction.item_details,
      is_featured: auction.is_featured,
      category: auction.category,
      status: auction.status,
      isTopFeaturedByBids,
    },
    resolvedBidCount,
    labels,
  });

  return labels;
}

export const AUCTION_LABEL_DISPLAY: Record<
  AuctionLabelId,
  { text: string; className: string }
> = {
  ENDING_SOON: {
    text: "⏱ Ending Soon",
    className: "bg-red-600 text-white",
  },
  FEATURED: {
    text: "⭐ Featured",
    className: "bg-purple-600 text-white",
  },
  HIGH_VALUE: {
    text: "💎 High Value",
    className: "bg-yellow-500 text-black",
  },
  HOT: {
    text: "🔥 Hot",
    className: "bg-orange-500 text-white",
  },
  RARE: {
    text: "✨ Rare",
    className: "bg-pink-600 text-white",
  },
  COLLECTOR: {
    text: "🏆 Collector",
    className: "bg-teal-600 text-white",
  },
  VINTAGE: {
    text: "🕰 Vintage",
    className: "bg-amber-600 text-white",
  },
  NEW: {
    text: "🆕 New",
    className: "bg-blue-500 text-white",
  },
  FIXED_PRICE: {
    text: "🏷️ Fixed Price",
    className: "bg-teal-600 text-white",
  },
};
