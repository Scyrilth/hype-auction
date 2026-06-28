export function onboardingStorageKey(walletAddress: string) {
  return `ha_onboarded_${walletAddress}`;
}

export function sellerBannerDismissKey(walletAddress: string) {
  return `ha_seller_banner_dismissed_${walletAddress}`;
}

export function isOnboarded(walletAddress: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(onboardingStorageKey(walletAddress)) === "true";
}

export function markOnboarded(walletAddress: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(onboardingStorageKey(walletAddress), "true");
}

export function isSellerBannerDismissed(walletAddress: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(sellerBannerDismissKey(walletAddress)) === "true";
}

export function dismissSellerBanner(walletAddress: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(sellerBannerDismissKey(walletAddress), "true");
}
