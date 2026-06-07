import Image from "next/image";
import Link from "next/link";

import ReferenceNumber from "@/components/ui/ReferenceNumber";
import { resolveAuctionImageUrl } from "@/lib/auction-images";
import type { AuctionSummaryPayload } from "@/lib/auction-lifecycle";
import { formatSol } from "@/lib/format";

export default function AuctionSummaryTile({
  summary,
}: {
  summary: AuctionSummaryPayload;
}) {
  const imageSrc = resolveAuctionImageUrl(summary.image_url, {
    title: summary.title,
    category: summary.category,
  });

  return (
    <div className="w-full max-w-sm rounded-xl border border-accent/40 bg-background/80 p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
          <Image
            src={imageSrc}
            alt={summary.title}
            width={64}
            height={64}
            className="h-full w-full object-cover object-center"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-white">
            {summary.title}
          </p>
          {summary.category && (
            <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
              {summary.category}
            </span>
          )}
          {summary.condition && (
            <p className="mt-1 text-[11px] text-muted">{summary.condition}</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 border-t border-border/60 pt-2.5">
        <p className="text-sm font-semibold text-accent">
          Winning Bid: {formatSol(summary.winning_bid)}
        </p>
        {summary.reference_number && (
          <ReferenceNumber referenceNumber={summary.reference_number} />
        )}
        <Link
          href={`/auction/${summary.auction_id}`}
          className="inline-block text-xs font-semibold text-purple-300 transition-colors hover:text-accent"
        >
          View Auction →
        </Link>
      </div>
    </div>
  );
}
