"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ProfileBidActivityList from "@/components/profile/ProfileBidActivityList";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileReviewsGivenList from "@/components/profile/ProfileReviewsGivenList";
import ProfileSettingsTab from "@/components/profile/ProfileSettingsTab";
import ProfileShippingTab from "@/components/profile/ProfileShippingTab";
import ProfileStatsRow from "@/components/profile/ProfileStatsRow";
import ProfileWatchlistTab from "@/components/profile/ProfileWatchlistTab";
import type { BuyerProfileData } from "@/lib/profile";

type ProfileTab =
  | "activity"
  | "won"
  | "reviews"
  | "watchlist"
  | "settings"
  | "shipping";

export default function ProfileView({ profile }: { profile: BuyerProfileData }) {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");

  const isOwner = publicKey?.toBase58() === profile.user.wallet_address;
  const showWonPublicly = profile.user.show_won_auctions ?? false;

  const tabs = useMemo(() => {
    const items: { id: ProfileTab; label: string }[] = [
      { id: "activity", label: "Bid Activity" },
    ];

    if (isOwner || showWonPublicly) {
      items.push({ id: "won", label: "Won Auctions" });
    }

    items.push({ id: "reviews", label: "Reviews Given" });

    if (isOwner) {
      items.push(
        { id: "watchlist", label: "Watchlist" },
        { id: "settings", label: "Privacy" },
        { id: "shipping", label: "Shipping" }
      );
    }

    return items;
  }, [isOwner, showWonPublicly]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("activity");
    }
  }, [tabs, activeTab]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ProfileHeader user={profile.user} />
      <ProfileStatsRow stats={profile.stats} />

      <section>
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-accent text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "activity" && (
          <ProfileBidActivityList
            items={profile.bidActivity}
            emptyMessage="No bid activity yet."
          />
        )}

        {activeTab === "won" && (
          <ProfileBidActivityList
            items={profile.wonAuctions}
            emptyMessage="No won auctions yet."
          />
        )}

        {activeTab === "reviews" && (
          <ProfileReviewsGivenList reviews={profile.reviewsGiven} />
        )}

        {activeTab === "watchlist" && isOwner && (
          <ProfileWatchlistTab auctions={profile.watchlist} />
        )}

        {activeTab === "settings" && isOwner && (
          <ProfileSettingsTab
            initialShowWonAuctions={profile.user.show_won_auctions ?? false}
          />
        )}

        {activeTab === "shipping" && isOwner && (
          <ProfileShippingTab walletAddress={profile.user.wallet_address} />
        )}
      </section>
    </div>
  );
}
