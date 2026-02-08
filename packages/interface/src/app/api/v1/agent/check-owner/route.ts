import { NextRequest, NextResponse } from "next/server"
import { checkOwnerReputation, CheckOwnerReputationError } from "@/use-cases/check-owner-reputation"
import { checkRateLimit } from "@/lib/rateLimit"
import { createProofRepository } from "@/repositories/proofRepository"

// Required for snarkjs WASM when withProof=true
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * POST /api/v1/agent/check-owner — Agent checks owner's reputation (API key auth via middleware)
 * No body needed — ownerAddress is derived from the API key.
 *
 * Query params:
 *   ?withProof=true — Generate ZK proofs for each context (adds ~3-4s)
 */
export async function POST(req: NextRequest) {
  try {
    const apiKeyHash = req.headers.get("x-basecred-key-id")
    if (!apiKeyHash) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "API key required" },
        { status: 401 }
      )
    }

    // Rate limit
    const rateCheck = checkRateLimit(apiKeyHash)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
      )
    }

    // Parse withProof flag from query string
    const withProof = req.nextUrl.searchParams.get("withProof") === "true"

    // Inject ProofRepository only when needed
    const deps = withProof ? { proofRepository: createProofRepository() } : undefined

    // 45s timeout safeguard — return meaningful error instead of platform kill
    const TIMEOUT_MS = 45_000
    const result = await Promise.race([
      checkOwnerReputation(apiKeyHash, { withProof }, deps),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new CheckOwnerReputationError("Request timed out", 504)), TIMEOUT_MS)
      ),
    ])

    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof CheckOwnerReputationError) {
      return NextResponse.json(
        { code: "CHECK_OWNER_ERROR", message: error.message },
        { status: error.status }
      )
    }
    console.error("Check owner reputation error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
