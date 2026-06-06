import { GavelIcon } from "@/components/icons";

export default function AuctionEmptyState() {
  return (
    <div className="flex h-full min-h-[12rem] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-10 text-center sm:px-6 sm:py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <GavelIcon className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-white">No live auctions</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        There are no active auctions right now. Check back soon or browse
        upcoming listings below.
      </p>
    </div>
  );
}
