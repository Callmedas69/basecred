import { NextRequest, NextResponse } from "next/server"
import { registerAgent, RegisterAgentError } from "@/use-cases/register-agent"
import { checkRateLimit } from "@/lib/rateLimit"

/**
 * POST /api/v1/agent/register — Agent self-registration (no auth)
 * Rate limited: 10/hour per IP
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateCheck = checkRateLimit(`register:ip:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
      )
    }

    const body = await req.json()
    const { agentName, telegramId, ownerAddress, webhookUrl } = body

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
