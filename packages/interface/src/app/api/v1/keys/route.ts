import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { generateApiKey, listApiKeys } from "@/use-cases/manage-api-keys"

/**
 * POST /api/v1/keys — Generate a new API key
 * Body: { address, signature, message, label? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, signature, message, label } = body

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

    const result = await generateApiKey(address, signature, message, label)

    return NextResponse.json({
      key: result.key,
      keyId: result.keyId,
      keyPrefix: result.keyPrefix,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("Generate API key error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/keys — List API keys for a wallet
 * Uses PUT instead of GET to keep credentials in request body (not URL).
 * Body: { address, signature, message }
 */
export async function PUT(req: NextRequest) {
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

    const keys = await listApiKeys(address, signature, message)

    return NextResponse.json({ keys })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("List API keys error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
