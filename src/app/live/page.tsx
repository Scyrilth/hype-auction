import AppShell from "@/components/layout/AppShell";
import LiveComingSoon from "@/components/live/LiveComingSoon";

export const metadata = {
  title: "Live Auctions — Hype Auction",
  description:
    "Live streaming auctions are coming soon to Hype Auction. Bid in real time on Solana.",
};

export default function LivePage() {
  return (
    <AppShell activePath="/live" contentClassName="flex flex-1 flex-col">
      <LiveComingSoon />
    </AppShell>
  );
}
