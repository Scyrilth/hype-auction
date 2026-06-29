import type { Auction, Review, User } from "@/lib/database.types";
import { parseAuctionRow } from "@/lib/parse-auction";
import { parseReviewRow } from "@/lib/reviews";
import { getProfileSlug } from "@/lib/profile-links";
import { supabase, type SupabaseClient } from "@/lib/supabase";
import { getVendorBySlug } from "@/lib/vendors";
import { getWatchlistAuctions } from "@/lib/watchlist";

export type BidActivityStatus = "WINNING" | "OUTBID" | "WON" | "LOST";

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
  outbidBy: number;
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
  watchlist: Auction[];
  reviewsGiven: ReviewWithVendor[];
  reviewedAuctionIds: string[];
}

function getBidActivityStatus(
  auction: Auction,
  wallet: string,
  userHighestBid: number,
  currentBid: number,
  topBidderWallet: string | undefined
): BidActivityStatus {
  if (auction.status === "live") {
    if (topBidderWallet === wallet && userHighestBid >= currentBid) {
      return "WINNING";
    }
    return "OUTBID";
  }

  if (
    (auction.status === "ended" || auction.status === "completed") &&
    topBidderWallet === wallet &&
    userHighestBid >= currentBid
  ) {
    return "WON";
  }

  return "LOST";
}

export async function updateProfilePrivacy(
  walletAddress: string,
  showWonAuctions: boolean,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from("users")
    .update({ show_won_auctions: showWonAuctions })
    .eq("wallet_address", walletAddress);

  if (error) throw error;
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
    const review = parseReviewRow(row as Record<string, unknown>);

    return {
      ...review,
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

  let watchlist: Auction[] = [];
  try {
    watchlist = await getWatchlistAuctions(wallet);
  } catch {
    watchlist = [];
  }

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
        supabase
          .from("auctions")
          .select(
            "id, title, description, image_url, seller_wallet, current_bid, start_price, end_time, status, category, condition, additional_images, item_details, created_at, is_featured, reference_number, tracking_courier, tracking_number, tracking_uploaded_at, shipping_status"
          )
          .in("id", auctionIds),
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
      const auction = parseAuctionRow(row as Record<string, unknown>);
      const userBid = userBidByAuction.get(auction.id)!;
      const topBid = topBidderByAuction.get(auction.id);
      const isWinner =
        (auction.status === "ended" || auction.status === "completed") &&
        topBid?.wallet === wallet &&
        userBid.highest === topBid.amount;

      if (isWinner) {
        auctionsWon += 1;
        totalSpent += userBid.highest;
      }

      const currentBid =
        auction.current_bid > 0 ? auction.current_bid : auction.start_price;
      const status = getBidActivityStatus(
        auction,
        wallet,
        userBid.highest,
        currentBid,
        topBid?.wallet
      );

      return {
        auction,
        userHighestBid: userBid.highest,
        currentBid,
        status,
        isWinner,
        outbidBy: Math.max(0, currentBid - userBid.highest),
        latestBidAt: userBid.latestBidAt,
      };
    });

    bidActivity.sort(
      (a, b) =>
        new Date(b.latestBidAt).getTime() - new Date(a.latestBidAt).getTime()
    );
  }

  const wonAuctions = bidActivity.filter((item) => item.isWinner);
  const reviewedAuctionIds = reviewsGiven
    .map((review) => review.auction_id)
    .filter((id): id is string => Boolean(id));

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
    watchlist,
    reviewsGiven,
    reviewedAuctionIds,
  };
}
