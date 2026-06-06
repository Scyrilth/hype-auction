export function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatSol(amount: number) {
  return `${amount.toFixed(2)} SOL`;
}

export function formatUsdSol(solAmount: number, solPriceUsd = 132.5) {
  return `$${(solAmount * solPriceUsd).toFixed(2)}`;
}

export function getSecondsUntil(isoDate: string) {
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000));
}

export function formatTimeLeft(isoDate: string) {
  const seconds = getSecondsUntil(isoDate);
  if (seconds <= 0) return "Ended";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRelativeFuture(isoDate: string) {
  const seconds = getSecondsUntil(isoDate);
  if (seconds <= 0) return "Soon";

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds}s`;
}
