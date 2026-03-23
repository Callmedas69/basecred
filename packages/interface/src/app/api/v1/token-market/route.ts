import { NextRequest, NextResponse } from "next/server"
import { getTokenMarketData, type TokenMarketData } from "@/use-cases/get-token-market-data"
import { checkRateLimit } from "@/lib/rateLimit"
import { toAppError } from "@/lib/errors"

// In-memory cache — 12-hour TTL
let cachedResponse: { data: { data: TokenMarketData }; expiresAt: number } | null = null
const CACHE_TTL_MS = 12 * 60 * 60 * 1000

/**
 * GET /api/v1/token-market — Public token market data (no auth)
 * Returns live price, market cap, volume, liquidity, txns from DexScreener.
 * Rate limited per IP (tokenMarket limiter: 10 req/min), cached for 12h.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = await checkRateLimit("tokenMarket", ip)
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
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=3600",
        },
      })
    }

    const marketData = await getTokenMarketData()
    const responseData = { data: marketData }

    cachedResponse = { data: responseData, expiresAt: now + CACHE_TTL_MS }

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    })
  } catch (error: unknown) {
    console.error("Get token market data error:", error)
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
