import CountdownTimer from "@/components/auction/CountdownTimer";

export default function BidPanel() {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Current Bid
        </p>
        <p className="mt-1 text-3xl font-bold text-white">2.35 SOL</p>
        <p className="text-sm text-muted">$311.47</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Time Left
        </p>
        <div className="mt-1">
          <CountdownTimer initialSeconds={18} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted">12 Bids</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Top Bidder</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <span className="font-mono text-xs text-zinc-300">7d7x...3FhG</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Place Bid 2.45 SOL
        </button>
        <button
          type="button"
          className="w-full rounded-full border border-border py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-accent hover:text-white"
        >
          Quick Bid +0.10 SOL
        </button>
      </div>
    </div>
  );
}
