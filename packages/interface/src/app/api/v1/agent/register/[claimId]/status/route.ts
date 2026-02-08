import { NextRequest, NextResponse } from "next/server"
import { checkAgentStatus } from "@/use-cases/check-agent-status"

const CLAIM_ID_REGEX = /^[a-f0-9]{64}$/

/**
 * GET /api/v1/agent/register/[claimId]/status — Agent polls claim status (no auth)
 * Optional query param: ?include=details (returns verification code for claim page)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const { claimId } = await params

    if (!CLAIM_ID_REGEX.test(claimId)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Invalid claim ID format" },
        { status: 400 }
      )
    }

    const includeDetails = req.nextUrl.searchParams.get("include") === "details"
    const result = await checkAgentStatus(claimId, includeDetails)
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error("Check agent status error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
