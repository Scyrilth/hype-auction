export function getProfileSlug(
  username: string | null | undefined,
  walletAddress: string
): string {
  const normalized = username?.replace(/^@+/, "").trim();
  return normalized || walletAddress;
}

export function getProfileHref(
  username: string | null | undefined,
  walletAddress: string
): string {
  return `/profile/${getProfileSlug(username, walletAddress)}`;
}

export function getShopOrProfileHref(user: {
  username: string | null;
  wallet_address: string;
  is_vendor: boolean;
}): string {
  if (user.is_vendor) {
    return `/shop/${getProfileSlug(user.username, user.wallet_address)}`;
  }
  return getProfileHref(user.username, user.wallet_address);
}
