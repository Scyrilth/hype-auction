import CategoryGrid from "@/components/categories/CategoryGrid";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { CATEGORIES, getLiveAuctionCountsByCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const liveCounts = await getLiveAuctionCountsByCategory();

  return (
    <AppShell
      activePath="/categories"
      contentClassName="flex-1 overflow-y-auto p-3 sm:p-4"
    >
      <BackButton className="mb-4" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Browse Categories
          </h1>
          <p className="mt-1 text-sm text-muted">
            Explore live auctions across {CATEGORIES.length} curated
            categories on LIVEAUCTION.
          </p>
        </header>

        <CategoryGrid categories={CATEGORIES} liveCounts={liveCounts} />
      </div>
    </AppShell>
  );
}
