import CategoryGrid from "@/components/categories/CategoryGrid";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import { CATEGORIES, getLiveAuctionCountsByCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const liveCounts = await getLiveAuctionCountsByCategory();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/categories" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <div className="mx-auto max-w-6xl space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Browse Categories
              </h1>
              <p className="mt-1 text-sm text-muted">
                Explore live auctions across {CATEGORIES.length} curated
                categories on LIVEAUCTION.
              </p>
            </header>

            <CategoryGrid categories={CATEGORIES} liveCounts={liveCounts} />
          </div>
        </main>
      </div>
    </div>
  );
}
