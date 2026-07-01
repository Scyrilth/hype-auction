import AuctionBidHistory from "@/components/auction/AuctionBidHistory";
import AuctionBidSidebar from "@/components/auction/AuctionBidSidebar";
import AuctionDetailSuggestions from "@/components/auction/AuctionDetailSuggestions";
import AuctionImageGallery from "@/components/auction/AuctionImageGallery";
import { GradingBadge } from "@/components/dashboard/GradeSelect";
import type { AuctionDetailData } from "@/lib/auctions";
import {
  formatItemDetailValue,
  getItemDetailLabel,
} from "@/lib/category-fields";
import {
  filterCustomItemDetails,
  getGradingFromItemDetails,
} from "@/lib/grading";

export default function AuctionDetailView({ data }: { data: AuctionDetailData }) {
  const { auction, seller, bids } = data;
  const shopSlug = seller.username?.trim() || auction.seller_wallet;
  const title = auction.title?.trim() || "Untitled Auction";
  const description = auction.description?.trim() ?? "";
  const itemDetails = auction.item_details ?? {};
  const grading = getGradingFromItemDetails(itemDetails);
  const detailEntries = Object.entries(filterCustomItemDetails(itemDetails));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <AuctionImageGallery auction={auction} />

          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {auction.category && (
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-purple-300">
                  {auction.category}
                </span>
              )}
              {auction.condition && (
                <span className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-zinc-400">
                  {auction.condition}
                </span>
              )}
              {grading && (
                <GradingBadge
                  company={grading.company}
                  grade={grading.grade}
                  label={grading.label}
                />
              )}
            </div>
          </div>

          {description && (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {description}
              </p>
            </section>
          )}

          {detailEntries.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Item Details
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {detailEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-background/60 px-3 py-3"
                  >
                    <dt className="text-xs uppercase tracking-wider text-muted">
                      {getItemDetailLabel(auction.category, key)}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-white">
                      {formatItemDetailValue(auction.category, key, value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <AuctionBidHistory bids={bids} topBidder={data.topBidder} />
        </div>

        <div className="lg:col-span-1">
          <AuctionBidSidebar
            auction={auction}
            seller={seller}
            bidCount={data.bidCount}
            topBidder={data.topBidder}
            topBidderUsername={data.topBidderUsername}
            sellerReviewCount={data.sellerReviewCount}
          />
        </div>
      </div>

      <AuctionDetailSuggestions
        auctionId={auction.id}
        sellerWallet={auction.seller_wallet}
        category={auction.category}
        shopSlug={shopSlug}
      />
    </div>
  );
}
