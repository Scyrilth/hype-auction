import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import BackButton from "@/components/ui/BackButton";
import {
  CrownIcon,
  GavelIcon,
  StarFilledIcon,
  TrophyIcon,
} from "@/components/icons";

const featurePreviews = [
  {
    title: "Bid Rewards",
    description: "Earn points for every bid placed",
    icon: GavelIcon,
  },
  {
    title: "Seller Bonuses",
    description: "Bonus rewards for successful sales",
    icon: StarFilledIcon,
  },
  {
    title: "Loyalty Tiers",
    description: "Bronze, Silver, Gold, Diamond tiers",
    icon: CrownIcon,
  },
] as const;

export default function RewardsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePath="/rewards" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />

        <main className="flex flex-1 flex-col overflow-y-auto px-4 py-10 sm:px-6">
          <BackButton className="mb-4 self-start" />
          <div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center self-center text-center">
            <span className="rounded-full bg-purple-900 px-4 py-1 text-sm text-purple-300">
              Coming Soon
            </span>

            <div className="mt-8 text-purple-500">
              <TrophyIcon className="h-16 w-16" />
            </div>

            <h1 className="mt-6 text-4xl font-bold text-white">Rewards</h1>

            <p className="mt-4 max-w-md text-lg text-muted">
              Coming soon — earn rewards for buying, selling, and participating
              in auctions on Hype Auction.
            </p>

            <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              {featurePreviews.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="flex flex-col items-center rounded-2xl border border-purple-500/30 bg-surface p-6 text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold text-white">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
