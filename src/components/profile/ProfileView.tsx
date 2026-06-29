"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import ProfileStrikeBanner from "@/components/profile/ProfileStrikeBanner";
import ProfileBidActivityList from "@/components/profile/ProfileBidActivityList";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileReviewsGivenList from "@/components/profile/ProfileReviewsGivenList";
import ProfileAccountSettingsTab from "@/components/profile/ProfileAccountSettingsTab";
import ProfileSettingsTab from "@/components/profile/ProfileSettingsTab";
import ProfileShippingTab from "@/components/profile/ProfileShippingTab";
import ProfileStatsRow from "@/components/profile/ProfileStatsRow";
import ProfileCollectionsTab from "@/components/profile/ProfileCollectionsTab";
import ProfileWatchlistTab from "@/components/profile/ProfileWatchlistTab";
import type { BuyerProfileData } from "@/lib/profile";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  fetchActiveBuyerStrikes,
  summarizeBuyerStrikes,
  type BuyerStrikeSummary,
} from "@/lib/buyer-strikes";

type ProfileTab =
  | "activity"
  | "won"
  | "reviews"
  | "transactions"
  | "watchlist"
  | "collections"
  | "account"
  | "settings"
  | "shipping";

export default function ProfileView({ profile }: { profile: BuyerProfileData }) {
  const { publicKey } = useWallet();
  const { client } = useSupabaseClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [strikeSummary, setStrikeSummary] = useState<BuyerStrikeSummary | null>(
    null
  );

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
      items.push({ id: "transactions", label: "Transactions" });
      items.push({ id: "watchlist", label: "Watchlist" });
    }

    items.push({ id: "collections", label: "Collections" });

    if (isOwner) {
      items.push(
        { id: "account", label: "Settings" },
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

  useEffect(() => {
    if (!isOwner || !publicKey) {
      setStrikeSummary(null);
      return;
    }

    let cancelled = false;

    void fetchActiveBuyerStrikes(publicKey.toBase58(), client)
      .then((strikes) => {
        if (!cancelled) {
          setStrikeSummary(summarizeBuyerStrikes(strikes));
        }
      })
      .catch(() => {
        if (!cancelled) setStrikeSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [client, isOwner, publicKey]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <ProfileHeader
        user={profile.user}
        strikeCount={
          isOwner && strikeSummary && strikeSummary.strikeCount > 0
            ? strikeSummary.strikeCount
            : undefined
        }
      />
      {isOwner && strikeSummary && (
        <ProfileStrikeBanner summary={strikeSummary} />
      )}
      <ProfileStatsRow stats={profile.stats} />

      <section>
        <div className="profile-tabs-scroll -mx-3 mb-4 overflow-x-auto border-b border-border px-3 pb-1 sm:mx-0 sm:px-0">
          <div className="flex w-max min-w-full flex-nowrap gap-1">
          {tabs.map((tab) =>
            tab.id === "transactions" ? (
              <Link
                key={tab.id}
                href="/transactions?mode=buying"
                className="shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-accent text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            )
          )}
          </div>
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
            showReviewActions={isOwner}
            showWonShipping={isOwner}
            reviewedAuctionIds={profile.reviewedAuctionIds}
          />
        )}

        {activeTab === "reviews" && (
          <ProfileReviewsGivenList reviews={profile.reviewsGiven} />
        )}

        {activeTab === "watchlist" && isOwner && (
          <ProfileWatchlistTab auctions={profile.watchlist} />
        )}

        {activeTab === "collections" && (
          <ProfileCollectionsTab
            profileWallet={profile.user.wallet_address}
            isOwner={isOwner}
          />
        )}

        {activeTab === "account" && isOwner && (
          <ProfileAccountSettingsTab
            initialUsername={profile.user.username}
            initialBio={profile.user.bio}
            initialAvatarUrl={profile.user.avatar_url}
            walletAddress={profile.user.wallet_address}
          />
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
