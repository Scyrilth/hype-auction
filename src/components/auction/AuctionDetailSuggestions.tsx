"use client";

import { useEffect, useState } from "react";

import AuctionSuggestionSection from "@/components/auction/AuctionSuggestionSection";
import { getBidCountsForAuctions } from "@/lib/auctions";
import {
  getMoreFromSellerAuctions,
  getSimilarAuctionsForDetail,
} from "@/lib/auction-suggestions";
import type { AuctionLabelMaps } from "@/lib/auction-labels";
import type { Auction } from "@/lib/database.types";

export default function AuctionDetailSuggestions({
  auctionId,
  sellerWallet,
  category,
  shopSlug,
}: {
  auctionId: string;
  sellerWallet: string;
  category: string | null;
  shopSlug: string;
}) {
  const [moreFromSeller, setMoreFromSeller] = useState<Auction[]>([]);
  const [similarItems, setSimilarItems] = useState<Auction[]>([]);
  const [labelMaps, setLabelMaps] = useState<AuctionLabelMaps | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const [sellerAuctions, similarAuctions] = await Promise.all([
          getMoreFromSellerAuctions(sellerWallet, auctionId),
          category
            ? getSimilarAuctionsForDetail({
                id: auctionId,
                category,
                seller_wallet: sellerWallet,
              })
            : Promise.resolve([] as Auction[]),
        ]);

        if (cancelled) return;

        setMoreFromSeller(sellerAuctions);
        setSimilarItems(similarAuctions);

        const auctionIds = [
          ...sellerAuctions.map((auction) => auction.id),
          ...similarAuctions.map((auction) => auction.id),
        ];

        if (auctionIds.length > 0) {
          const bidCounts = await getBidCountsForAuctions(auctionIds);
          if (!cancelled) {
            setLabelMaps({
              bidCounts,
              bidCounts24h: new Map(),
              topFeaturedIds: new Set(),
            });
          }
        }
      } catch (error) {
        console.error("AuctionDetailSuggestions:load", error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [auctionId, sellerWallet, category]);

  if (!loaded) return null;
  if (!moreFromSeller.length && !similarItems.length) return null;

  const similarViewAllHref = category
    ? `/browse?category=${encodeURIComponent(category)}`
    : undefined;

  return (
    <div className="space-y-8">
      <AuctionSuggestionSection
        title="More from this seller"
        viewAllHref={`/shop/${shopSlug}`}
        auctions={moreFromSeller}
        labelMaps={labelMaps}
      />
      <AuctionSuggestionSection
        title="Similar items"
        viewAllHref={similarViewAllHref}
        auctions={similarItems}
        labelMaps={labelMaps}
      />
    </div>
  );
}
