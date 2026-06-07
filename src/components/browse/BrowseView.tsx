import InfiniteCarouselRow from "@/components/auction/InfiniteCarouselRow";
import BrowseCategoryGrid from "@/components/browse/BrowseCategoryGrid";
import BrowseSearchHero from "@/components/browse/BrowseSearchHero";
import BrowseSection from "@/components/browse/BrowseSection";
import type { BrowsePageData } from "@/lib/browse";
import { CATEGORIES } from "@/lib/categories";

export default function BrowseView({ data }: { data: BrowsePageData }) {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Browse</h1>
          <p className="mt-1 text-sm text-muted">
            Discover live auctions, categories, and trending items.
          </p>
        </div>
        <BrowseSearchHero />
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Categories</h2>
        <BrowseCategoryGrid categories={CATEGORIES} liveCounts={data.liveCounts} />
      </section>

      {data.trending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Trending Now</h2>
          <InfiniteCarouselRow
            variant="trending"
            items={data.trending}
          />
        </section>
      )}

      <BrowseSection title="Ending Soon" auctions={data.endingSoon} />
      <BrowseSection title="Recently Listed" auctions={data.recentlyListed} />
    </div>
  );
}
