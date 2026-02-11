/**
 * Activity Repository
 *
 * Abstracts Redis storage for agent activity logging.
 * Uses sorted sets with timestamp scores for efficient retrieval.
 */

import { getRedis } from "@/lib/redis"
import type { ActivityEntry } from "@/types/apiKeys"
import type { GlobalFeedEntry } from "@/types/agentRegistration"

export interface IActivityRepository {
  logActivity(entry: ActivityEntry): Promise<void>
  getActivities(walletAddress: string, limit?: number): Promise<ActivityEntry[]>
  logGlobalFeedEntry(entry: GlobalFeedEntry): Promise<void>
  getGlobalFeed(limit?: number): Promise<GlobalFeedEntry[]>
}

export function createActivityRepository(): IActivityRepository {
  const redis = getRedis()

  return {
    async logActivity(entry: ActivityEntry): Promise<void> {
      const key = `activity:${entry.subject.toLowerCase()}`
      await redis.zadd(key, {
        score: entry.timestamp,
        member: JSON.stringify(entry),
      })

      // Trim to last 1000 entries to prevent unbounded growth
      const count = await redis.zcard(key)
      if (count > 1000) {
        await redis.zremrangebyrank(key, 0, count - 1001)
      }
    },

    async getActivities(walletAddress: string, limit: number = 100): Promise<ActivityEntry[]> {
      const key = `activity:${walletAddress.toLowerCase()}`
      const entries = await redis.zrange(key, "+inf", "-inf", {
        byScore: true,
        rev: true,
        count: limit,
        offset: 0,
      })

      return entries.reduce<ActivityEntry[]>((acc, entry) => {
        try {
          const parsed = typeof entry === "string" ? JSON.parse(entry) : entry
          acc.push(parsed as ActivityEntry)
        } catch {
          console.warn("[activityRepository] Skipping corrupted activity entry")
        }
        return acc
      }, [])
    },

    async logGlobalFeedEntry(entry: GlobalFeedEntry): Promise<void> {
      const key = "global:agent:feed"
      await redis.zadd(key, {
        score: entry.timestamp,
        member: JSON.stringify(entry),
      })

      // Trim to last 100 entries
      const count = await redis.zcard(key)
      if (count > 100) {
        await redis.zremrangebyrank(key, 0, count - 101)
      }
    },

    async getGlobalFeed(limit: number = 20): Promise<GlobalFeedEntry[]> {
      const entries = await redis.zrange("global:agent:feed", "+inf", "-inf", {
        byScore: true,
        rev: true,
        count: limit,
        offset: 0,
      })

      return entries.reduce<GlobalFeedEntry[]>((acc, entry) => {
        try {
          const parsed = typeof entry === "string" ? JSON.parse(entry) : entry
          acc.push(parsed as GlobalFeedEntry)
        } catch {
          console.warn("[activityRepository] Skipping corrupted feed entry")
        }
        return acc
      }, [])
    },
  }
}
