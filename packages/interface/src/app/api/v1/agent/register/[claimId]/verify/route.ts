import { NextRequest, NextResponse } from "next/server"
import { verifyAgentClaim, VerifyAgentClaimError } from "@/use-cases/verify-agent-claim"

/**
 * POST /api/v1/agent/register/[claimId]/verify — Tweet verification (no auth)
 * Body: { tweetUrl }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const { claimId } = await params
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
