"use client";

import InfiniteCarouselRow from "@/components/auction/InfiniteCarouselRow";
import { TrendingUpIcon } from "@/components/icons";
import type { AuctionWithBidCount24h } from "@/lib/auctions";

export default function TrendingSection({
  items,
}: {
  items: AuctionWithBidCount24h[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUpIcon className="h-6 w-6 text-orange-400" />
        <h2 className="text-2xl font-bold text-white">Trending</h2>
        <span aria-hidden>🔥</span>
      </div>

      <InfiniteCarouselRow variant="trending" items={items} />
    </section>
  );
}
