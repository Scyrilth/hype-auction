import {
  getAllLiveAuctions,
  getBidCountsInLast24Hours,
  type AuctionWithBidCount24h,
} from "@/lib/auctions";
import { CATEGORIES, getLiveAuctionCountsByCategory } from "@/lib/categories";

export interface BrowsePageData {
  liveCounts: Record<string, number>;
  auctions: AuctionWithBidCount24h[];
}

export async function getBrowsePageData(): Promise<BrowsePageData> {
  const [liveCountsMap, liveAuctions] = await Promise.all([
    getLiveAuctionCountsByCategory(),
    getAllLiveAuctions(),
  ]);

  const bidCounts = await getBidCountsInLast24Hours(
    liveAuctions.map((auction) => auction.id)
  );

  const auctions: AuctionWithBidCount24h[] = liveAuctions.map((auction) => ({
    auction,
    bidCount24h: bidCounts.get(auction.id) ?? 0,
  }));

  const liveCounts: Record<string, number> = {};
  for (const [label, count] of liveCountsMap.entries()) {
    liveCounts[label] = count;
  }

  return {
    liveCounts,
    auctions,
  };
}

export { CATEGORIES };
