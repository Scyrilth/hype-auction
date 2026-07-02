/** Tiered minimum bid increment based on the current bid floor (SOL). */
export function getMinimumBidIncrement(currentBid: number): number {
  if (currentBid < 1) return 0.01;
  if (currentBid < 5) return 0.05;
  if (currentBid < 20) return 0.1;
  if (currentBid < 50) return 0.5;
  if (currentBid < 100) return 1;
  return 2;
}

export function getMinimumBidAmount(floor: number): number {
  const increment = getMinimumBidIncrement(floor);
  return Math.round((floor + increment) * 100) / 100;
}
