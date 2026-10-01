/**
 * In-memory fixed-window rate limiter (spec 11.7). Per-instance — fine for the
 * single-VPS deployment model; swap the store for Redis to scale horizontally.
 * `now` is injectable for deterministic tests.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSec: 0,
  };
}

/** Test helper — clear all buckets. */
export function __resetRateLimits() {
  store.clear();
}

export const LIMITS = {
  login: { limit: 5, windowMs: 15 * 60_000 }, // 5 / 15 min per IP+email
  interviewTurn: { limit: 60, windowMs: 60 * 60_000 }, // 60 / hour per nanny
  presign: { limit: 20, windowMs: 60 * 60_000 }, // 20 / hour per nanny
} as const;
