import { NextRequest, NextResponse } from "next/server"

/**
 * SHA-256 hash using Web Crypto API (Edge Runtime compatible).
 */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Parse a URL safely, returning null on malformed input.
 */
function safeParseHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

/**
 * API key auth middleware for /api/v1/decide and /api/v1/decide-with-proof.
 *
 * - If x-api-key header is present: validate against Upstash Redis, forward key metadata
 * - If no x-api-key and request is from a browser same-origin context: allow (frontend calls)
 * - Otherwise: reject with 401
 *
 * Same-origin detection uses Sec-Fetch-Site (unforgeable browser header) as the primary
 * signal, with Origin/Referer as fallback for browsers that don't send Sec-Fetch-Site.
 */
export async function middleware(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")

  if (!apiKey) {
    // Check Sec-Fetch-Site first (set by browsers, cannot be forged by scripts)
    const secFetchSite = req.headers.get("sec-fetch-site")

    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      return NextResponse.next()
    }

    // Fallback: check Origin/Referer for browsers without Sec-Fetch-Site support
    if (!secFetchSite) {
      const host = req.headers.get("host") || ""
      const origin = req.headers.get("origin")
      const referer = req.headers.get("referer")
      const originHost = origin ? safeParseHost(origin) : null
      const refererHost = referer ? safeParseHost(referer) : null

      if ((originHost && originHost === host) || (refererHost && refererHost === host)) {
        return NextResponse.next()
      }
    }

    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
      { status: 401 }
    )
  }

  // Validate API key against Redis
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!redisUrl || !redisToken) {
      console.error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured")
      return NextResponse.json(
        { code: "SERVICE_UNAVAILABLE", message: "API key validation unavailable" },
        { status: 503 }
      )
    }

    const keyHash = await sha256Hex(apiKey)

    // Use Upstash REST API directly (middleware runs on Edge Runtime)
    const response = await fetch(`${redisUrl}/get/apikey:${keyHash}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })

    if (!response.ok) {
      console.error("Redis lookup failed:", response.status)
      return NextResponse.json(
        { code: "SERVICE_UNAVAILABLE", message: "API key validation unavailable" },
        { status: 503 }
      )
    }

    const data = await response.json()

    if (!data.result) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
        { status: 401 }
      )
    }

    // Forward key metadata for downstream use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-basecred-key-id", keyHash)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch (error) {
    console.error("Middleware API key validation error:", error)
    return NextResponse.json(
      { code: "SERVICE_UNAVAILABLE", message: "API key validation unavailable" },
      { status: 503 }
    )
  }
}

export const config = {
  matcher: ["/api/v1/decide", "/api/v1/decide-with-proof", "/api/v1/agent/check-owner"],
}
