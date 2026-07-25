import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
  return `ratelimit:${route}:${wallet}`;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number }> {
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > config.limit) {
      const ttl = await redis.ttl(key);
      const retryAfterMs = ttl > 0 ? ttl * 1000 : config.windowMs;
      return { allowed: false, retryAfterMs };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[rate-limiter] Redis error, failing open:", error);
    return { allowed: true };
  }
}

export async function isRateLimited(
  wallet: string,
  route: keyof typeof RATE_LIMITS
): Promise<boolean> {
  const result = await checkRateLimit(
    rateLimitKey(wallet, route),
    RATE_LIMITS[route]
  );
  return !result.allowed;
}
