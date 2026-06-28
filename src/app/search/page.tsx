import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import SearchResults from "@/components/search/SearchResults";
import AppShell from "@/components/layout/AppShell";
import BackButton from "@/components/ui/BackButton";
import { performGlobalSearch, resolveSearchPageQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = resolveSearchPageQuery(params);
  const results = query
    ? await performGlobalSearch(query)
    : {
        query: "",
        vendors: [],
        liveAuctions: [],
        categories: [],
        pastAuctions: [],
      };

  return (
    <AppShell contentClassName="flex-1 overflow-y-auto p-3 sm:p-4">
      <BackButton className="mb-4" />
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Search
          </h1>
          {query && (
            <p className="mt-1 text-sm text-muted">
              Results for &ldquo;{query}&rdquo;
            </p>
          )}
        </header>

        <GlobalSearchBar initialQuery={query} variant="page" />
        <SearchResults results={results} />
      </div>
    </AppShell>
  );
}
