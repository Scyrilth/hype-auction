type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMIT_MESSAGE = "Too many requests, please slow down";

export const RATE_LIMITS = {
  bids: { limit: 10, windowMs: 60_000 },
  listings: { limit: 5, windowMs: 60 * 60 * 1000 },
  messages: { limit: 30, windowMs: 60_000 },
} as const;

export function rateLimitKey(wallet: string, route: string): string {
  return `${wallet}:${route}`;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true };
}

export function isRateLimited(
  wallet: string,
  route: keyof typeof RATE_LIMITS
): boolean {
  const result = checkRateLimit(
    rateLimitKey(wallet, route),
    RATE_LIMITS[route]
  );
  return !result.allowed;
}
