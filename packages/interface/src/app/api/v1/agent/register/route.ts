import { NextRequest, NextResponse } from "next/server"
import { registerAgent, RegisterAgentError } from "@/use-cases/register-agent"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/v1/agent/register — Agent self-registration (no auth)
 * Rate limited: 10/hour per IP
 */
export async function POST(req: NextRequest) {
  try {
    // Reject oversized payloads (100KB limit)
    const contentLength = Number(req.headers.get("content-length") || "0")
    if (contentLength > 100_000) {
      return NextResponse.json(
        { code: "PAYLOAD_TOO_LARGE", message: "Request body too large" },
        { status: 413 }
      )
    }

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const ipCheck = await checkRateLimit("registration", ip)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipCheck.retryAfter ?? 60) } }
      )
    }

    const body = await req.json()
    const { agentName, telegramId, ownerAddress, webhookUrl } = body

    // Rate limit per wallet to prevent namespace pollution
    if (ownerAddress && typeof ownerAddress === "string") {
      const walletCheck = await checkRateLimit("registrationWallet", ownerAddress.toLowerCase())
      if (!walletCheck.allowed) {
        return NextResponse.json(
          { code: "RATE_LIMITED", message: "Too many registrations for this wallet. Please try again later." },
          { status: 429, headers: { "Retry-After": String(walletCheck.retryAfter ?? 60) } }
        )
      }
    }

    const result = await registerAgent({ agentName, telegramId, ownerAddress, webhookUrl })

    return NextResponse.json({
      apiKey: result.apiKey,
      claimId: result.claimId,
      claimUrl: result.claimUrl,
      verificationCode: result.verificationCode,
      message: "SAVE YOUR API KEY! It will not be shown again. Send the claim URL to your owner to activate it.",
    })
  } catch (error: unknown) {
    if (error instanceof RegisterAgentError) {
      return NextResponse.json(
        { code: "REGISTRATION_ERROR", message: error.message },
        { status: error.status }
      )
    }
    console.error("Agent registration error:", error)
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
