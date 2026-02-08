/**
 * Get Global Feed Use Case
 *
 * Returns the most recent agent reputation check entries from the global feed.
 */

import { createActivityRepository } from "@/repositories/activityRepository"
import type { GlobalFeedEntry } from "@/types/agentRegistration"

export async function getGlobalFeed(limit: number = 20): Promise<GlobalFeedEntry[]> {
  const repo = createActivityRepository()
  return repo.getGlobalFeed(limit)
}
