import {
  AUCTION_LABEL_DISPLAY,
  createAuctionLabelInput,
  getAuctionLabels,
  type AuctionLabelInput,
} from "@/lib/auction-labels";

export default function AuctionLabelBadges({
  auction,
  bidCount,
  bidCount24h,
  isTopFeaturedByBids,
  className = "",
}: AuctionLabelInput & { className?: string }) {
  const labels = getAuctionLabels(
    createAuctionLabelInput(auction, {
      bidCount,
      bidCount24h,
      isTopFeaturedByBids,
    })
  );

  if (labels.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${className}`.trim()}
    >
      {labels.map((labelId) => {
        const badge = AUCTION_LABEL_DISPLAY[labelId];

        return (
          <span
            key={labelId}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
          >
            {badge.text}
          </span>
        );
      })}
    </div>
  );
}
