import { NextRequest, NextResponse } from "next/server"
import { isAddress } from "viem"
import { revokeApiKey } from "@/use-cases/manage-api-keys"

const KEY_ID_PATTERN = /^[a-f0-9]{64}$/

/**
 * DELETE /api/v1/keys/[keyId] — Revoke an API key
 * Body: { address, signature, message }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await params

    if (!KEY_ID_PATTERN.test(keyId)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Invalid key ID format" },
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

    const revoked = await revokeApiKey(keyId, address, signature, message)

    if (!revoked) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: "API key not found or not owned by this wallet" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Invalid or expired wallet signature") {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: msg },
        { status: 401 }
      )
    }
    console.error("Revoke API key error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
