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
 * HMAC-SHA256 using Web Crypto API (Edge Runtime compatible).
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message))
  const sigArray = Array.from(new Uint8Array(sig))
  return sigArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

const HMAC_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Verify HMAC signature on a request.
 * Returns null if valid, error message if invalid.
 */
async function verifyHmacSignature(
  req: NextRequest,
  keyHash: string,
  body: string
): Promise<string | null> {
  const signature = req.headers.get("x-basecred-signature")
  const timestamp = req.headers.get("x-basecred-timestamp")

  if (!signature || !timestamp) {
    return "Missing HMAC signature or timestamp headers"
  }

  // Replay protection: reject timestamps older than 5 minutes
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return "Invalid timestamp"

  const age = Date.now() - ts
  if (age < 0 || age > HMAC_MAX_AGE_MS) {
    return "Request timestamp expired or in the future"
  }

  // HMAC-SHA256 hex output is always exactly 64 characters
  if (signature.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(signature)) {
    return "Invalid HMAC signature format"
  }

  // Build canonical message: method + pathname + search + body + timestamp
  const url = new URL(req.url)
  const canonicalMessage = `${req.method}${url.pathname}${url.search}${body}${timestamp}`

  const expected = await hmacSha256(canonicalMessage, keyHash)

  // Constant-time comparison via double-hashing
  const a = await sha256Hex(signature)
  const b = await sha256Hex(expected)
  if (a !== b) {
    return "Invalid HMAC signature"
  }

  return null
}

/**
 * API key auth middleware for /api/v1/decide-with-proof, /api/v1/agent/check-owner, and /api/v1/agent/submit.
 *
 * Accepts three auth methods for non-browser clients:
 * 1. HMAC (recommended): x-basecred-key-id + x-basecred-signature + x-basecred-timestamp
 * 2. x-api-key: raw API key (bc_...) — hashed server-side, then validated against Redis (legacy)
 * 3. x-basecred-key-id alone: pre-computed SHA256 hash — validated directly against Redis (legacy, deprecated)
 *
 * Browser same-origin requests (Sec-Fetch-Site: same-origin | none) are allowed without a key.
 *
 * Only trusts Sec-Fetch-Site (unforgeable browser header). No Origin/Referer fallback —
 * those are trivially spoofable by non-browser clients.
 */
export async function middleware(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  const apiKeyId = req.headers.get("x-basecred-key-id")
  const hmacSignature = req.headers.get("x-basecred-signature")

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

    // Support three auth methods:
    // 1. x-api-key: raw API key (bc_...) → hash it, then look up
    // 2. x-basecred-key-id + HMAC signature → look up, then verify HMAC
    // 3. x-basecred-key-id alone → look up directly (legacy, deprecated)
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

    // If HMAC signature is present, verify it
    if (hmacSignature) {
      // Clone the request to read the body without consuming it
      const cloned = req.clone()
      const body = await cloned.text()

      const hmacError = await verifyHmacSignature(req, keyHash, body)
      if (hmacError) {
        return NextResponse.json(
          { code: "UNAUTHORIZED", message: hmacError },
          { status: 401, headers: SECURITY_HEADERS }
        )
      }
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
