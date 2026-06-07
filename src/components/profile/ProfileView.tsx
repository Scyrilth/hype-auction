"use client";

import { useState } from "react";

import ProfileBidActivityList from "@/components/profile/ProfileBidActivityList";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileReviewsGivenList from "@/components/profile/ProfileReviewsGivenList";
import ProfileStatsRow from "@/components/profile/ProfileStatsRow";
import type { BuyerProfileData } from "@/lib/profile";

type ProfileTab = "activity" | "won" | "reviews";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "activity", label: "Bid Activity" },
  { id: "won", label: "Won Auctions" },
  { id: "reviews", label: "Reviews Given" },
];

export default function ProfileView({ profile }: { profile: BuyerProfileData }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");

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
      </section>
    </div>
  );
}
