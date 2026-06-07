"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useWatchlist } from "@/components/auction/WatchlistProvider";
import { HeartFilledIcon, HeartIcon } from "@/components/icons";

export default function WatchlistHeart({ auctionId }: { auctionId: string }) {
  const { connected } = useWallet();
  const { isWatching, toggleWatchlist } = useWatchlist();

  if (!connected) return null;

  const watching = isWatching(auctionId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleWatchlist(auctionId);
      }}
      className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      aria-label={watching ? "Remove from watchlist" : "Add to watchlist"}
    >
      {watching ? (
        <HeartFilledIcon className="h-4 w-4 text-accent" />
      ) : (
        <HeartIcon className="h-4 w-4 text-white/90" />
      )}
    </button>
  );
}
