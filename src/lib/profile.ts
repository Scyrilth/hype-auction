import type { Auction, Review, User } from "@/lib/database.types";
import { getProfileSlug } from "@/lib/profile-links";
import { supabase } from "@/lib/supabase";
import { getVendorBySlug } from "@/lib/vendors";

export type BidActivityStatus = "LIVE" | "ENDED" | "WON";

export interface BuyerProfileStats {
  totalBidsPlaced: number;
  auctionsWon: number;
  totalSpent: number;
  reviewsGiven: number;
}

export interface BuyerBidActivity {
  auction: Auction;
  userHighestBid: number;
  currentBid: number;
  status: BidActivityStatus;
  isWinner: boolean;
  latestBidAt: string;
}

export interface ReviewWithVendor extends Review {
  vendor_username: string | null;
  vendor_shop_name: string | null;
  vendor_avatar: string | null;
  vendor_is_vendor: boolean;
}

export interface BuyerProfileData {
  user: User;
  profileSlug: string;
  stats: BuyerProfileStats;
  bidActivity: BuyerBidActivity[];
  wonAuctions: BuyerBidActivity[];
  reviewsGiven: ReviewWithVendor[];
}

function parseAuction(row: Record<string, unknown>): Auction {
  const itemDetails = row.item_details;
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    seller_wallet: row.seller_wallet as string,
    current_bid: Number(row.current_bid),
    start_price: Number(row.start_price),
    end_time: row.end_time as string,
    status: row.status as Auction["status"],
    category: (row.category as string | null) ?? null,
    condition: (row.condition as string | null) ?? null,
    additional_images: Array.isArray(row.additional_images)
      ? (row.additional_images as string[])
      : [],
    item_details:
      itemDetails && typeof itemDetails === "object" && !Array.isArray(itemDetails)
        ? (itemDetails as Record<string, string>)
        : {},
    created_at: row.created_at as string,
  };
}

function getActivityStatus(
  auction: Auction,
  isWinner: boolean
): BidActivityStatus {
  if (isWinner) return "WON";
  if (auction.status === "live") return "LIVE";
  return "ENDED";
}

async function getReviewsByReviewer(
  reviewerWallet: string
): Promise<ReviewWithVendor[]> {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewer_wallet", reviewerWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!reviews?.length) return [];

  const vendorWallets = [
    ...new Set(reviews.map((row) => row.vendor_wallet as string)),
  ];

  const { data: vendors, error: vendorsError } = await supabase
    .from("users")
    .select("wallet_address, username, shop_name, avatar_url, is_vendor")
    .in("wallet_address", vendorWallets);

  if (vendorsError) throw vendorsError;

  const vendorMap = new Map(
    (vendors ?? []).map((row) => [row.wallet_address as string, row])
  );

  return reviews.map((row) => {
    const vendor = vendorMap.get(row.vendor_wallet as string);

    return {
      id: row.id as string,
      vendor_wallet: row.vendor_wallet as string,
      reviewer_wallet: row.reviewer_wallet as string,
      auction_id: (row.auction_id as string | null) ?? null,
      rating: row.rating as number,
      comment: (row.comment as string | null) ?? null,
      created_at: row.created_at as string,
      vendor_username: (vendor?.username as string | null) ?? null,
      vendor_shop_name: (vendor?.shop_name as string | null) ?? null,
      vendor_avatar: (vendor?.avatar_url as string | null) ?? null,
      vendor_is_vendor: Boolean(vendor?.is_vendor),
    };
  });
}

export async function getBuyerProfileData(
  slug: string
): Promise<BuyerProfileData | null> {
  const user = await getVendorBySlug(slug);
  if (!user) return null;

  const wallet = user.wallet_address;

  const [{ data: bids, error: bidsError }, reviewsGiven] = await Promise.all([
    supabase
      .from("bids")
      .select("*")
      .eq("bidder_wallet", wallet)
      .order("created_at", { ascending: false }),
    getReviewsByReviewer(wallet),
  ]);

  if (bidsError) throw bidsError;

  const bidRows = bids ?? [];
  const totalBidsPlaced = bidRows.length;

  const userBidByAuction = new Map<
    string,
    { highest: number; latestBidAt: string }
  >();

  for (const row of bidRows) {
    const auctionId = row.auction_id as string;
    const amount = Number(row.amount);
    const createdAt = row.created_at as string;
    const existing = userBidByAuction.get(auctionId);

    if (!existing) {
      userBidByAuction.set(auctionId, { highest: amount, latestBidAt: createdAt });
      continue;
    }

    userBidByAuction.set(auctionId, {
      highest: Math.max(existing.highest, amount),
      latestBidAt:
        new Date(createdAt).getTime() > new Date(existing.latestBidAt).getTime()
          ? createdAt
          : existing.latestBidAt,
    });
  }

  const auctionIds = [...userBidByAuction.keys()];
  let bidActivity: BuyerBidActivity[] = [];
  let auctionsWon = 0;
  let totalSpent = 0;

  if (auctionIds.length > 0) {
    const [{ data: auctions, error: auctionsError }, { data: allBids, error: allBidsError }] =
      await Promise.all([
        supabase.from("auctions").select("*").in("id", auctionIds),
        supabase
          .from("bids")
          .select("auction_id, bidder_wallet, amount")
          .in("auction_id", auctionIds)
          .order("amount", { ascending: false }),
      ]);

    if (auctionsError) throw auctionsError;
    if (allBidsError) throw allBidsError;

    const topBidderByAuction = new Map<
      string,
      { wallet: string; amount: number }
    >();

    for (const row of allBids ?? []) {
      const auctionId = row.auction_id as string;
      if (!topBidderByAuction.has(auctionId)) {
        topBidderByAuction.set(auctionId, {
          wallet: row.bidder_wallet as string,
          amount: Number(row.amount),
        });
      }
    }

    bidActivity = (auctions ?? []).map((row) => {
      const auction = parseAuction(row as Record<string, unknown>);
      const userBid = userBidByAuction.get(auction.id)!;
      const topBid = topBidderByAuction.get(auction.id);
      const isWinner =
        auction.status === "ended" &&
        topBid?.wallet === wallet &&
        userBid.highest === topBid.amount;

      if (isWinner) {
        auctionsWon += 1;
        totalSpent += userBid.highest;
      }

      const currentBid =
        auction.current_bid > 0 ? auction.current_bid : auction.start_price;

      return {
        auction,
        userHighestBid: userBid.highest,
        currentBid,
        status: getActivityStatus(auction, isWinner),
        isWinner,
        latestBidAt: userBid.latestBidAt,
      };
    });

    bidActivity.sort(
      (a, b) =>
        new Date(b.latestBidAt).getTime() - new Date(a.latestBidAt).getTime()
    );
  }

  const wonAuctions = bidActivity.filter((item) => item.isWinner);

  return {
    user,
    profileSlug: getProfileSlug(user.username, user.wallet_address),
    stats: {
      totalBidsPlaced,
      auctionsWon,
      totalSpent,
      reviewsGiven: reviewsGiven.length,
    },
    bidActivity,
    wonAuctions,
    reviewsGiven,
  };
}
