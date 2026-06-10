const ACTION_BASE =
  "cursor-pointer transition-all duration-150 ease-in-out hover:scale-[1.02]";

export const adminActionButtonClass = {
  release: `${ACTION_BASE} rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-300 hover:bg-emerald-500/35`,
  refund: `${ACTION_BASE} rounded-full bg-amber-500/20 px-2 py-1 text-amber-300 hover:bg-amber-400/40`,
  thread: `${ACTION_BASE} rounded-full border border-border px-2 py-0.5 text-muted hover:border-purple-500/40 hover:bg-purple-500/25 hover:text-purple-200`,
  sellerWins: `${ACTION_BASE} rounded-full bg-emerald-600/20 px-3 py-1 text-emerald-300 hover:bg-emerald-500/35`,
  buyerWins: `${ACTION_BASE} rounded-full bg-blue-600/20 px-3 py-1 text-blue-300 hover:bg-blue-500/35`,
  warning: `${ACTION_BASE} rounded-full bg-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-400/35`,
  cooldown: `${ACTION_BASE} rounded-full bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/35`,
  suspension: `${ACTION_BASE} rounded-full bg-orange-600/20 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/35`,
  ban: `${ACTION_BASE} rounded-full bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/35`,
  lift: `${ACTION_BASE} rounded-full border border-border px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-500/30 hover:text-white`,
  search: `${ACTION_BASE} rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover`,
} as const;
