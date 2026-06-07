import InfiniteCarouselRow from "@/components/auction/InfiniteCarouselRow";
import BrowseAuctionCard from "@/components/browse/BrowseAuctionCard";
import type { Auction } from "@/lib/database.types";

export default function BrowseSection({
  title,
  auctions,
}: {
  title: string;
  auctions: Auction[];
}) {
  if (auctions.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <InfiniteCarouselRow
        items={auctions}
        getKey={(auction) => auction.id}
        renderItem={(auction) => <BrowseAuctionCard auction={auction} />}
      />
    </section>
  );
}
