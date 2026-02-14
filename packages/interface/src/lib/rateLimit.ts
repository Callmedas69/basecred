/**
 * Redis-backed rate limiter using @upstash/ratelimit.
 * Distributed, survives restarts, shared across serverless instances.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { getRedis } from "@/lib/redis"

// Pre-configured limiters for each endpoint type
const limiters = {
  /** /api/v1/agent/check-owner, /api/v1/decide-with-proof — per API key */
  apiKey: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      prefix: "rl:apikey",
    }),

  /** /api/v1/agent/register — per IP */
  registration: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "3600 s"),
      prefix: "rl:register",
    }),

  /** /api/v1/agent/register — per wallet (prevents namespace pollution) */
  registrationWallet: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "3600 s"),
      prefix: "rl:register-wallet",
    }),

  /** /api/v1/agent/register/[claimId]/verify — per IP and per claimId */
  verify: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, "3600 s"),
      prefix: "rl:verify",
    }),

  /** /api/v1/keys — per wallet */
  keygen: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "3600 s"),
      prefix: "rl:keygen",
    }),

  /** /api/v1/agent/feed — per IP */
  feed: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "rl:feed",
    }),

  /** /api/v1/stats — per IP */
  stats: () =>
    new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "rl:stats",
    }),
} as const

export type RateLimiterType = keyof typeof limiters

// Cache instances so we don't recreate on every request
const instances = new Map<RateLimiterType, Ratelimit>()

function getLimiter(type: RateLimiterType): Ratelimit {
  let instance = instances.get(type)
  if (!instance) {
    instance = limiters[type]()
    instances.set(type, instance)
  }
  return instance
}

/**
 * Check rate limit for a given type and identifier.
 * Returns { allowed, retryAfter } matching the old API shape for easy migration.
 */
export async function checkRateLimit(
  type: RateLimiterType,
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limiter = getLimiter(type)
  const result = await limiter.limit(identifier)

  if (result.success) {
    return { allowed: true }
  }

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return { allowed: false, retryAfter }
}
