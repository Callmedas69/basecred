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
 * API key auth middleware for /api/v1/decide-with-proof, /api/v1/agent/check-owner, and /api/v1/agent/submit.
 *
 * Accepts two auth methods for non-browser clients:
 * - x-api-key: raw API key (bc_...) — hashed server-side, then validated against Redis
 * - x-basecred-key-id: pre-computed SHA256 hash of the API key — validated directly against Redis
 *
 * Browser same-origin requests (Sec-Fetch-Site: same-origin | none) are allowed without a key.
 *
 * Only trusts Sec-Fetch-Site (unforgeable browser header). No Origin/Referer fallback —
 * those are trivially spoofable by non-browser clients.
 */
export async function middleware(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  const apiKeyId = req.headers.get("x-basecred-key-id")

  if (!apiKey && !apiKeyId) {
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

    // Support two auth methods:
    // 1. x-api-key: raw API key (bc_...) → hash it, then look up
    // 2. x-basecred-key-id: pre-computed SHA256 hash → look up directly
    const keyHash = apiKey ? await sha256Hex(apiKey) : apiKeyId!

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
  matcher: ["/api/v1/decide-with-proof", "/api/v1/agent/check-owner", "/api/v1/agent/submit"],
}
