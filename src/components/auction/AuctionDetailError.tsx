import Link from "next/link";

export default function AuctionDetailError({
  message,
}: {
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-xl font-semibold text-white">
        Unable to load this auction
      </h1>
      <p className="mt-2 text-sm text-muted">
        {message ??
          "Something went wrong while loading the listing. It may have been removed or is temporarily unavailable."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/browse"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Browse auctions
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-accent hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
