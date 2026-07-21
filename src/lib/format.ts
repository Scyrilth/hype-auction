export function normalizeSocialHandle(value: string): string | null {
  const handle = value.trim().replace(/^@+/, "");
  return handle || null;
}

export function displaySocialHandle(handle: string | null): string {
  if (!handle) return "";
  return `@${handle.replace(/^@+/, "")}`;
}

export function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/** Wallet display: first 8 + ... + last 6 characters. */
export function truncateWalletAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
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

export function formatTimeAgo(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function formatPaidAgo(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return null;

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Paid just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "Paid 1 minute ago" : `Paid ${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "Paid 1 hour ago" : `Paid ${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "Paid 1 day ago" : `Paid ${days} days ago`;
  }

  return `Paid on ${new Date(isoDate).toLocaleDateString()}`;
}

export function formatOpenedAgo(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return null;

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Opened just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "Opened 1 minute ago" : `Opened ${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "Opened 1 hour ago" : `Opened ${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "Opened 1 day ago" : `Opened ${days} days ago`;
  }

  return `Opened on ${new Date(isoDate).toLocaleDateString()}`;
}
