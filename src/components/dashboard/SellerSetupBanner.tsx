"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { dismissSellerBanner, isSellerBannerDismissed } from "@/lib/onboarding";

export default function SellerSetupBanner({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(isSellerBannerDismissed(walletAddress));
  }, [walletAddress]);

  if (hidden) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#4C1D95] px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pr-8">
        <p className="text-sm font-semibold text-white">
          Ready to start selling? Set up your shop in 30 seconds
        </p>
        <Link
          href="/dashboard/settings?sellerSetup=1"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#4C1D95] transition-all duration-150 ease-in-out hover:scale-[1.02] hover:bg-purple-50"
        >
          Set up shop →
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          dismissSellerBanner(walletAddress);
          setHidden(true);
        }}
        className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Dismiss banner"
      >
        <i className="ti ti-x text-base" />
      </button>
    </div>
  );
}
