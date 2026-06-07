import BrowseAuctionCard from "@/components/browse/BrowseAuctionCard";
import type { Auction } from "@/lib/database.types";

export default function ProfileWatchlistTab({
  auctions,
}: {
  auctions: Auction[];
}) {
  if (auctions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted">
          Your watchlist is empty. Heart an auction to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {auctions.map((auction) => (
        <BrowseAuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}
