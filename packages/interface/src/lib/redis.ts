/**
 * Shared Redis client singleton.
 * All repositories use this to avoid creating multiple connections per request.
 */

import { Redis } from "@upstash/redis"

let redisInstance: Redis | null = null

export function getRedis(): Redis {
  if (redisInstance) return redisInstance

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set")
  }

  redisInstance = new Redis({ url, token })
  return redisInstance
}
