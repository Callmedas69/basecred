import { NextRequest, NextResponse } from "next/server"
import { getGlobalFeed } from "@/use-cases/get-global-feed"
import { checkRateLimit } from "@/lib/rateLimit"

// In-memory cache to absorb burst reads from concurrent polling clients
let cachedResponse: { data: unknown; expiresAt: number } | null = null
const CACHE_TTL_MS = 15_000 // 15 seconds

/**
 * GET /api/v1/agent/feed — Public global activity feed (no auth)
 * Returns last 20 agent reputation checks.
 * Rate limited per IP, cached for 15s.
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = await checkRateLimit("feed", ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
      )
    }

    // Serve from in-memory cache if fresh
    const now = Date.now()
    if (cachedResponse && cachedResponse.expiresAt > now) {
      return NextResponse.json(cachedResponse.data, {
        headers: { "Cache-Control": "public, max-age=15" },
      })
    }

    const entries = await getGlobalFeed(20)
    const data = { entries }

    // Update cache
    cachedResponse = { data, expiresAt: now + CACHE_TTL_MS }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=15" },
    })
  } catch (error: unknown) {
    console.error("Get global feed error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
