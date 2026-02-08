import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { listOwnerAgents } from "@/use-cases/list-owner-agents"

/**
 * POST /api/v1/agent/registrations — Owner lists their agents (wallet-auth)
 * Body: { address, signature, message }
 */
export async function POST(req: NextRequest) {
  try {
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

    const registrations = await listOwnerAgents(address, signature, message)
    return NextResponse.json({ registrations })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("List owner agents error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
