import {
  getAllLiveAuctions,
  getTrendingAuctions,
  type AuctionWithBidCount24h,
} from "@/lib/auctions";
import { CATEGORIES, getLiveAuctionCountsByCategory } from "@/lib/categories";
import type { Auction } from "@/lib/database.types";

export interface BrowsePageData {
  liveCounts: Map<string, number>;
  trending: AuctionWithBidCount24h[];
  endingSoon: Auction[];
  recentlyListed: Auction[];
}

export async function getBrowsePageData(): Promise<BrowsePageData> {
  const [liveCounts, trending, liveAuctions] = await Promise.all([
    getLiveAuctionCountsByCategory(),
    getTrendingAuctions(10),
    getAllLiveAuctions(),
  ]);

  const endingSoon = [...liveAuctions]
    .sort(
      (a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime()
    )
    .slice(0, 8);

  const recentlyListed = [...liveAuctions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 8);

  return {
    liveCounts,
    trending,
    endingSoon,
    recentlyListed,
  };
}

export { CATEGORIES };
