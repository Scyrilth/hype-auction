import type { Metadata } from "next";

import AppShell from "@/components/layout/AppShell";
import LiveComingSoon from "@/components/live/LiveComingSoon";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Live Auctions — Hype Auction",
  description:
    "Live streaming auctions are coming soon to Hype Auction. Bid in real time on Solana.",
  path: "/live",
});

export default function LivePage() {
  return (
    <AppShell activePath="/live" contentClassName="flex flex-1 flex-col">
      <LiveComingSoon />
    </AppShell>
  );
}
