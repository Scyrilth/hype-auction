import Link from "next/link";

import HypeAuctionLogo from "@/components/brand/HypeAuctionLogo";

function LivePulseDot({ className = "h-2 w-2" }: { className?: string }) {
  return (
    <span className={`relative flex ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-red opacity-60" />
      <span className="relative inline-flex h-full w-full rounded-full bg-live-red" />
    </span>
  );
}

export default function LiveComingSoon() {
  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.18)_0%,_transparent_55%)]"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <HypeAuctionLogo
          imageClassName="h-10 w-10 sm:h-11 sm:w-11"
          asLink={false}
          showText={false}
        />

        <div className="mt-10 flex items-center gap-2.5">
          <LivePulseDot className="h-2.5 w-2.5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-live-red">
            Live
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Live Auctions
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Watch sellers auction items in real time. Bid live, win instantly.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-purple-500/40 bg-gradient-to-r from-purple-600/30 via-accent/25 to-purple-600/30 px-6 py-2.5 shadow-[0_0_32px_rgba(124,58,237,0.25)]">
          <LivePulseDot className="h-3 w-3" />
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-purple-100 sm:text-base">
            Coming Soon
          </span>
        </div>

        <p className="mt-8 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
          Live streaming auctions are coming to Hype Auction. Connect your
          wallet and follow sellers to get notified when they go live.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Browse Listings →
          </Link>
          <Link
            href="/vendors"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-accent/40 hover:bg-surface"
          >
            Follow Sellers →
          </Link>
        </div>

        <p className="mt-12 max-w-md text-xs leading-relaxed text-muted sm:text-sm">
          Live auctions will be powered by real-time Solana escrow — same
          trustless settlement as regular auctions.
        </p>
      </div>
    </div>
  );
}
