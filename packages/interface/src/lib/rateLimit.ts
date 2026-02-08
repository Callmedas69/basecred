/**
 * In-memory sliding-window rate limiter.
 * 100 requests/minute per API key.
 * Upgradeable to @upstash/ratelimit later.
 */

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 100

interface WindowEntry {
  timestamps: number[]
}

const windows = new Map<string, WindowEntry>()

// Periodic cleanup of stale entries (every 5 minutes)
let cleanupScheduled = false
function scheduleCleanup() {
  if (cleanupScheduled) return
  cleanupScheduled = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of windows) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS)
      if (entry.timestamps.length === 0) {
        windows.delete(key)
      }
    }
  }, 5 * 60_000)
}

export function checkRateLimit(apiKeyId: string): { allowed: boolean; retryAfter?: number } {
  scheduleCleanup()

  const now = Date.now()
  let entry = windows.get(apiKeyId)

  if (!entry) {
    entry = { timestamps: [] }
    windows.set(apiKeyId, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS)

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.timestamps.push(now)
  return { allowed: true }
}
