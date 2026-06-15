"use client";

import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { useWallet } from "@solana/wallet-adapter-react";

export default function HomepageHero() {
  const { connected } = useWallet();
  const connectPhantom = usePhantomConnect();

  if (connected) return null;

  const scrollToListings = () => {
    document.getElementById("homepage-listings")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] px-6 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Live Auctions on Solana
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-purple-100 sm:text-base">
          Bid on rare collectibles, sneakers, streetwear and more. Trustless
          escrow. Instant settlement.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void connectPhantom()}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#4C1D95] transition-all duration-150 ease-in-out hover:scale-[1.02] hover:bg-purple-50"
          >
            Connect Wallet
          </button>
          <button
            type="button"
            onClick={scrollToListings}
            className="rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:scale-[1.02] hover:bg-white/20"
          >
            Browse Listings
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {[
            "⚡ Instant settlement",
            "🔒 Trustless escrow",
            "🌍 Ships worldwide",
          ].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-purple-100"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
