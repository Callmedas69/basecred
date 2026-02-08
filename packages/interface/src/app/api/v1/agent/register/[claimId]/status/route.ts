import { NextRequest, NextResponse } from "next/server"
import { checkAgentStatus } from "@/use-cases/check-agent-status"

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
