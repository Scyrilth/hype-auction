import Image from "next/image";
import Link from "next/link";

import { EyeIcon } from "@/components/icons";
import {
  POKEMON_PLACEHOLDER,
  resolveAuctionImageUrl,
} from "@/lib/auction-images";
import type { Auction } from "@/lib/database.types";

const FEATURED_POKEMON_IMAGE =
  "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png";

function getFeaturedStreamImage(auction: Auction): string {
  const resolved = resolveAuctionImageUrl(auction.image_url, auction);

  if (resolved === POKEMON_PLACEHOLDER || resolved.includes("psacard.com")) {
    return FEATURED_POKEMON_IMAGE;
  }

  return resolved;
}

export default function LiveStream({ auction }: { auction: Auction }) {
  const imageSrc = getFeaturedStreamImage(auction);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <Link
        href={`/auction/${auction.id}`}
        className="group relative block aspect-video w-full cursor-pointer"
      >
        <Image
          src={imageSrc}
          alt={auction.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 transition-colors group-hover:from-black/85" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-live-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <EyeIcon />
            Live now
          </span>
        </div>

        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors group-hover:bg-black/60 group-hover:text-white">
          View Details →
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-5">
          <h2 className="text-base font-bold text-white sm:text-lg">{auction.title}</h2>
          {auction.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-300 sm:text-sm">
              {auction.description}
            </p>
          )}
          {auction.category && (
            <span className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-medium text-purple-300">
              {auction.category}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
