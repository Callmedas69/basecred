import { NextRequest, NextResponse } from "next/server"
import { verifyAgentClaimWallet, VerifyAgentClaimWalletError } from "@/use-cases/verify-agent-claim-wallet"
import { checkRateLimit } from "@/lib/rateLimit"

const CLAIM_ID_REGEX = /^[a-f0-9]{64}$/

/**
 * POST /api/v1/agent/register/[claimId]/verify-wallet — Wallet signature verification (no auth)
 * Rate limited: 20/hour per IP + 20/hour per claimId (same limiter as tweet verification)
 * Body: { signature, message }
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

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const ipCheck = await checkRateLimit("verify", `ip:${ip}`)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipCheck.retryAfter ?? 60) } }
      )
    }

    // Rate limit per claimId
    const claimCheck = await checkRateLimit("verify", `claim:${claimId}`)
    if (!claimCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many verification attempts for this claim. Please try again later." },
        { status: 429, headers: { "Retry-After": String(claimCheck.retryAfter ?? 60) } }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Invalid JSON body" },
        { status: 400 }
      )
    }
    const { signature, message } = body

    const result = await verifyAgentClaimWallet(claimId, signature, message)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof VerifyAgentClaimWalletError) {
      return NextResponse.json(
        { code: "VERIFICATION_ERROR", message: error.message },
        { status: error.status }
      )
    }
    console.error("Agent wallet verification error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
