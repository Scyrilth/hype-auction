"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useToast } from "@/components/ui/Toast";
import { usePhantomConnect } from "@/hooks/usePhantomConnect";
import { toggleFollow } from "@/lib/follows";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";

export default function FollowButton({
  vendorWallet,
  initialFollowing,
  onFollowersChange,
}: {
  vendorWallet: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  onFollowersChange?: (count: number) => void;
}) {
  const { publicKey, connected } = useWallet();
  const connectPhantom = usePhantomConnect();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!connected || !publicKey) {
      try {
        await connectPhantom();
        showToast("Wallet connected! Click Follow again.");
      } catch {
        showToast("Connect your wallet to follow vendors.", "error");
      }
      return;
    }

    if (publicKey.toBase58() === vendorWallet) {
      showToast("You cannot follow your own shop.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await toggleFollow(publicKey.toBase58(), vendorWallet);
      setIsFollowing(result.isFollowing);
      onFollowersChange?.(result.followersCount);
      showToast(result.isFollowing ? "Following!" : "Unfollowed.");
    } catch (error) {
      logSupabaseError("FollowButton", error);
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        isFollowing
          ? "border border-border bg-surface-elevated text-white hover:border-accent/50"
          : "bg-accent text-white hover:bg-accent-hover"
      }`}
    >
      {isLoading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
