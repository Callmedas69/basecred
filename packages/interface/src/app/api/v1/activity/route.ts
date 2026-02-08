import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { getActivityLog } from "@/use-cases/get-activity-log"

/**
 * POST /api/v1/activity — Get activity log for a wallet
 * Uses POST to keep credentials in request body (not URL query params).
 * Body: { address, signature, message, limit? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, signature, message, limit: limitRaw } = body
    const limit = typeof limitRaw === "number" ? limitRaw : 100

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

    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "limit must be between 1 and 1000" },
        { status: 400 }
      )
    }

    const activities = await getActivityLog(address, signature, message, limit)

    return NextResponse.json({ activities })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("Get activity log error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
