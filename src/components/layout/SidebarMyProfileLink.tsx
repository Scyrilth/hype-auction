"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import UserAvatar from "@/components/ui/UserAvatar";
import { getProfileHref } from "@/lib/profile-links";
import { supabase } from "@/lib/supabase";

export default function SidebarMyProfileLink({
  activePath = "/",
}: {
  activePath?: string;
}) {
  const { publicKey, connected } = useWallet();
  const [username, setUsername] = useState<string | null>(null);

  const wallet = publicKey?.toBase58() ?? null;

  useEffect(() => {
    if (!connected || !wallet) {
      setUsername(null);
      return;
    }

    let cancelled = false;

    supabase
      .from("users")
      .select("username")
      .eq("wallet_address", wallet)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setUsername((data?.username as string | null) ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connected, wallet]);

  if (!connected || !wallet) return null;

  const href = getProfileHref(username, wallet);
  const isActive =
    activePath === href || activePath.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors ${
        isActive
          ? "bg-accent/15 font-medium text-accent"
          : "text-zinc-300 hover:bg-surface-elevated hover:text-white"
      }`}
    >
      <UserAvatar
        walletAddress={wallet}
        alt="My profile"
        size="xs"
        className="border border-border"
      />
      <span>My Profile</span>
    </Link>
  );
}
