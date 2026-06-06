"use client";

import { useState } from "react";

import ShopAuctionGrid from "@/components/shop/ShopAuctionGrid";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopReviewsList from "@/components/shop/ShopReviewsList";
import type { VendorShopData } from "@/lib/vendors";

type ShopTab = "live" | "past" | "reviews";

const tabs: { id: ShopTab; label: string }[] = [
  { id: "live", label: "Live Auctions" },
  { id: "past", label: "Past Auctions" },
  { id: "reviews", label: "Reviews" },
];

export default function ShopView({
  shop,
  initialFollowing,
}: {
  shop: VendorShopData;
  initialFollowing: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ShopTab>("live");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ShopHeader
        vendor={shop.vendor}
        stats={shop.stats}
        initialFollowing={initialFollowing}
      />

      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-white"
              }`}
            >
              {tab.label}
              {tab.id === "live" && shop.liveAuctions.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-purple-300">
                  {shop.liveAuctions.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "live" && (
        <ShopAuctionGrid
          auctions={shop.liveAuctions}
          emptyMessage="No live auctions right now."
          showCountdown
        />
      )}

      {activeTab === "past" && (
        <ShopAuctionGrid
          auctions={shop.pastAuctions}
          emptyMessage="No completed auctions yet."
        />
      )}

      {activeTab === "reviews" && (
        <ShopReviewsList reviews={shop.reviews} />
      )}
    </div>
  );
}
