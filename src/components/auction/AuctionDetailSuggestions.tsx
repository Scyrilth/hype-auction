"use client";

import { useEffect, useState } from "react";

import AuctionSuggestionSection from "@/components/auction/AuctionSuggestionSection";
import { getBidCountsForAuctions } from "@/lib/auctions";
import {
  getMoreFromSellerAuctions,
  getSimilarAuctionsForDetail,
  getTrendingListings,
} from "@/lib/auction-suggestions";
import type { AuctionLabelMaps } from "@/lib/auction-labels";
import type { Auction } from "@/lib/database.types";

type SecondarySection = {
  title: string;
  viewAllHref: string;
  auctions: Auction[];
};

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
  const [secondarySection, setSecondarySection] = useState<SecondarySection | null>(
    null
  );
  const [labelMaps, setLabelMaps] = useState<AuctionLabelMaps | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const sellerAuctions = await getMoreFromSellerAuctions(
          sellerWallet,
          auctionId
        );

        let similarAuctions: Auction[] = [];
        if (category) {
          similarAuctions = await getSimilarAuctionsForDetail({
            id: auctionId,
            category,
            seller_wallet: sellerWallet,
          });
        }

        let secondary: SecondarySection | null = null;

        if (similarAuctions.length > 0) {
          secondary = {
            title: "Similar items",
            viewAllHref: `/browse?category=${encodeURIComponent(category!)}`,
            auctions: similarAuctions,
          };
        } else {
          const trendingAuctions = await getTrendingListings(auctionId);
          if (trendingAuctions.length > 0) {
            secondary = {
              title: "Trending items",
              viewAllHref: "/browse",
              auctions: trendingAuctions,
            };
          }
        }

        if (cancelled) return;

        setMoreFromSeller(sellerAuctions);
        setSecondarySection(secondary);

        const auctionIds = [
          ...sellerAuctions.map((auction) => auction.id),
          ...(secondary?.auctions.map((auction) => auction.id) ?? []),
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
  if (!moreFromSeller.length && !secondarySection) return null;

  return (
    <div className="space-y-8">
      <AuctionSuggestionSection
        title="More from this seller"
        viewAllHref={`/shop/${shopSlug}`}
        auctions={moreFromSeller}
        labelMaps={labelMaps}
      />
      {secondarySection ? (
        <AuctionSuggestionSection
          title={secondarySection.title}
          viewAllHref={secondarySection.viewAllHref}
          auctions={secondarySection.auctions}
          labelMaps={labelMaps}
        />
      ) : null}
    </div>
  );
}
