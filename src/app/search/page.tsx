import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import SearchResults from "@/components/search/SearchResults";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import { performGlobalSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? await performGlobalSearch(q) : {
    query: "",
    vendors: [],
    liveAuctions: [],
    categories: [],
    pastAuctions: [],
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          <BackButton className="mb-4" />
          <div className="mx-auto max-w-6xl space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Search
              </h1>
              {q && (
                <p className="mt-1 text-sm text-muted">
                  Results for &ldquo;{q}&rdquo;
                </p>
              )}
            </header>

            <GlobalSearchBar initialQuery={q} variant="page" />
            <SearchResults results={results} />
          </div>
        </main>
      </div>
    </div>
  );
}
