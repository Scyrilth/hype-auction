export function getDicebearAvatarUrl(walletAddress: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(walletAddress)}`;
}

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  walletAddress: string
): string {
  const trimmed = avatarUrl?.trim();
  if (trimmed) return trimmed;
  return getDicebearAvatarUrl(walletAddress);
}
