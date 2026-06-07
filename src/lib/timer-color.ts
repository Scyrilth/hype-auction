export function getTimerColor(secondsLeft: number): string {
  if (secondsLeft > 86400) return "text-green-400"; // >24h
  if (secondsLeft > 21600) return "text-blue-400"; // 6-24h
  if (secondsLeft > 3600) return "text-yellow-400"; // 1-6h
  if (secondsLeft > 900) return "text-orange-400"; // 15min-1h
  return "text-red-500 animate-pulse"; // <15min
}
