"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { SearchIcon } from "@/components/icons";

export default function GlobalSearchBar({
  initialQuery = "",
  variant = "nav",
}: {
  initialQuery?: string;
  variant?: "nav" | "page";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitSearch();
  };

  const isNav = variant === "nav";

  return (
    <form
      onSubmit={handleSubmit}
      className={isNav ? "relative min-w-0 flex-1" : "relative w-full"}
    >
      <button
        type="submit"
        className={`absolute top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-white ${
          isNav ? "left-3" : "left-4"
        }`}
        aria-label="Search"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search items, users, categories..."
        className={
          isNav
            ? "w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            : "w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        }
      />
    </form>
  );
}
