export type SpecialBadgeType = "founder" | "admin";

export const SPECIAL_BADGES: Record<string, SpecialBadgeType[]> = {
  CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT: ["founder", "admin"],
};

export function getSpecialBadges(walletAddress: string): SpecialBadgeType[] {
  return SPECIAL_BADGES[walletAddress] ?? [];
}
