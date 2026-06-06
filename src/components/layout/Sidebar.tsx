import {
  GavelIcon,
  LightningIcon,
  ShieldIcon,
  SolanaLogo,
  StarIcon,
  VideoIcon,
  WalletIcon,
} from "@/components/icons";

const features = [
  { icon: VideoIcon, label: "Live Streaming" },
  { icon: GavelIcon, label: "Live Auctions" },
  { icon: WalletIcon, label: "Pay with Crypto" },
  { icon: ShieldIcon, label: "Secure & Transparent" },
  { icon: StarIcon, label: "Collect & Earn" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface px-5 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <LightningIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-wide text-white">
            LIVEAUCTION
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted">Live Auctions. On Solana.</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {features.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-zinc-300"
          >
            <Icon className="h-4 w-4 shrink-0 text-accent" />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      <button
        type="button"
        className="mt-6 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Join Waitlist
      </button>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted">
        <span>Built on</span>
        <SolanaLogo className="h-4 w-4" />
        <span className="font-semibold tracking-wider text-zinc-400">SOLANA</span>
      </div>
    </aside>
  );
}
