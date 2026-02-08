import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { revokeAgent, RevokeAgentError } from "@/use-cases/revoke-agent"

const CLAIM_ID_REGEX = /^[a-f0-9]{64}$/

/**
 * DELETE /api/v1/agent/registrations/[claimId] — Owner revokes agent (wallet-auth)
 * Body: { address, signature, message }
 */
export async function DELETE(
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

    const body = await req.json()
    const { address, signature, message } = body

    if (!address || !signature || !message) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "address, signature, and message are required" },
        { status: 400 }
      )
    }

    if (!isAddress(address)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Valid Ethereum address required" },
        { status: 400 }
      )
    }

    const result = await revokeAgent(claimId, address, signature, message)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof RevokeAgentError) {
      return NextResponse.json(
        { code: "REVOKE_ERROR", message: error.message },
        { status: error.status }
      )
    }
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("Revoke agent error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
