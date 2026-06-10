export function getAdminWallet(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_WALLET ??
    "CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT"
  ).trim();
}

export function isAdminWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false;
  return wallet.trim() === getAdminWallet();
}
