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

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

/**
 * API key auth middleware for /api/v1/decide and /api/v1/agent/check-owner.
 *
 * - If x-api-key header is present: validate against Upstash Redis, forward key metadata
 * - If Sec-Fetch-Site is "same-origin" or "none": allow (browser same-origin request)
 * - Otherwise: reject with 401
 *
 * Only trusts Sec-Fetch-Site (unforgeable browser header). No Origin/Referer fallback —
 * those are trivially spoofable by non-browser clients.
 */
export async function middleware(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")

  if (!apiKey) {
    // Only trust Sec-Fetch-Site — unforgeable in browsers, absent in non-browser clients
    const secFetchSite = req.headers.get("sec-fetch-site")

    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      const res = NextResponse.next()
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v)
      return res
    }

    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
      { status: 401, headers: SECURITY_HEADERS }
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
        { status: 503, headers: SECURITY_HEADERS }
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
        { status: 503, headers: SECURITY_HEADERS }
      )
    }

    const data = await response.json()

    if (!data.result) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Invalid or missing API key" },
        { status: 401, headers: SECURITY_HEADERS }
      )
    }

    // Forward key metadata for downstream use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-basecred-key-id", keyHash)

    const res = NextResponse.next({
      request: { headers: requestHeaders },
    })
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v)
    return res
  } catch (error) {
    console.error("Middleware API key validation error:", error)
    return NextResponse.json(
      { code: "SERVICE_UNAVAILABLE", message: "API key validation unavailable" },
      { status: 503, headers: SECURITY_HEADERS }
    )
  }
}

export const config = {
  matcher: ["/api/v1/decide", "/api/v1/decide-with-proof", "/api/v1/agent/check-owner"],
}
