import {
  AUCTION_LABEL_DISPLAY,
  getAuctionLabels,
  type AuctionLabelInput,
} from "@/lib/auction-labels";

export default function AuctionLabelBadges({
  auction,
  bidCount,
  bidCount24h,
  isTopFeaturedByBids,
}: AuctionLabelInput) {
  const labels = getAuctionLabels({
    auction,
    bidCount,
    bidCount24h,
    isTopFeaturedByBids,
  });

  if (labels.length === 0) return null;

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
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
