import { NextRequest, NextResponse } from "next/server"
import { getProtocolStats, type ProtocolStats } from "@/use-cases/get-protocol-stats"
import { checkRateLimit } from "@/lib/rateLimit"
import { toAppError } from "@/lib/errors"

// In-memory cache — 5-minute TTL to limit RPC / Redis calls
let cachedResponse: { data: { stats: ProtocolStats }; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/v1/stats — Public protocol stats (no auth)
 * Returns aggregated on-chain + Redis metrics.
 * Rate limited per IP, cached for 5 min.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = await checkRateLimit("stats", ip)
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
        headers: { "Cache-Control": "public, max-age=300" },
      })
    }

    const stats = await getProtocolStats()
    const data = { stats }

    // Update cache
    cachedResponse = { data, expiresAt: now + CACHE_TTL_MS }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    })
  } catch (error: unknown) {
    console.error("Get protocol stats error:", error)
    const appError = toAppError(error)

    // Serve stale cache on failure if available
    if (cachedResponse) {
      return NextResponse.json(cachedResponse.data, {
        headers: { "Cache-Control": "public, max-age=60" },
      })
    }

    return NextResponse.json(
      { code: appError.code, message: appError.message },
      { status: appError.status }
    )
  }
}
