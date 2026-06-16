import Link from "next/link";

import AppShell from "@/components/layout/AppShell";

export default function AuctionNotFound() {
  return (
    <AppShell contentClassName="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-white">Auction not found</h1>
      <p className="text-sm text-muted">
        This listing may have been removed or the link is incorrect.
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Back to auctions
      </Link>
    </AppShell>
  );
}
