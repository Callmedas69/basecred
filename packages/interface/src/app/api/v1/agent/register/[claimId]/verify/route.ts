import { NextRequest, NextResponse } from "next/server"
import { verifyAgentClaim, VerifyAgentClaimError } from "@/use-cases/verify-agent-claim"
import { checkRateLimit } from "@/lib/rateLimit"

const CLAIM_ID_REGEX = /^[a-f0-9]{64}$/

/**
 * POST /api/v1/agent/register/[claimId]/verify — Tweet verification (no auth)
 * Rate limited: 20/hour per IP + 20/hour per claimId (prevents oEmbed amplification)
 * Body: { tweetUrl }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const { claimId } = await params

    // Reject oversized payloads (100KB limit)
    const contentLength = Number(req.headers.get("content-length") || "0")
    if (contentLength > 100_000) {
      return NextResponse.json(
        { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" },
        { status: 413 }
      )
    }

    if (!CLAIM_ID_REGEX.test(claimId)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Invalid claim ID format" },
        { status: 400 }
      )
    }

    // Rate limit by IP to prevent oEmbed amplification abuse
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const ipCheck = await checkRateLimit("verify", `ip:${ip}`)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipCheck.retryAfter ?? 60) } }
      )
    }

    // Rate limit per claimId to limit retries on a single registration
    const claimCheck = await checkRateLimit("verify", `claim:${claimId}`)
    if (!claimCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many verification attempts for this claim. Please try again later." },
        { status: 429, headers: { "Retry-After": String(claimCheck.retryAfter ?? 60) } }
      )
    }

    const body = await req.json()
    const { tweetUrl } = body

    const result = await verifyAgentClaim(claimId, tweetUrl)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof VerifyAgentClaimError) {
      return NextResponse.json(
        { code: "VERIFICATION_ERROR", message: error.message },
        { status: error.status }
      )
    }
    console.error("Agent verification error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
