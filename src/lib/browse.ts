import {
  getAllLiveAuctions,
  getBidCountsForAuctions,
  getBidCountsInLast24Hours,
} from "@/lib/auctions";
import type { Auction } from "@/lib/database.types";
import { CATEGORIES, getLiveAuctionCountsByCategory } from "@/lib/categories";

export interface BrowseAuctionItem {
  auction: Auction;
  bidCount: number;
  bidCount24h: number;
}

export interface BrowsePageData {
  liveCounts: Record<string, number>;
  auctions: BrowseAuctionItem[];
}

export async function getBrowsePageData(): Promise<BrowsePageData> {
  const [liveCountsMap, liveAuctions] = await Promise.all([
    getLiveAuctionCountsByCategory(),
    getAllLiveAuctions(),
  ]);

  const auctionIds = liveAuctions.map((auction) => auction.id);
  const [bidCounts24h, bidCounts] = await Promise.all([
    getBidCountsInLast24Hours(auctionIds),
    getBidCountsForAuctions(auctionIds),
  ]);

  const auctions: BrowseAuctionItem[] = liveAuctions.map((auction) => ({
    auction,
    bidCount: bidCounts.get(auction.id) ?? 0,
    bidCount24h: bidCounts24h.get(auction.id) ?? 0,
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
