/**
 * Decide with ZK Proof API — Transport Layer
 *
 * Validates input, applies rate limiting, delegates to use case.
 */

// Force Node.js runtime (required for snarkjs WASM operations)
export const runtime = "nodejs"
// ZK proof generation + on-chain submission — allow up to 90s
export const maxDuration = 90

import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rateLimit"
import { VALID_CONTEXTS, type DecisionContext } from "basecred-decision-engine"
import {
    executeDecideWithProof,
    CircuitNotAvailableError,
    PolicyNotFoundError,
} from "@/use-cases/decide-with-proof"

interface DecideWithProofRequest {
    subject: string
    context: string
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP — expensive endpoint (3 API calls + ZK proof + on-chain tx)
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        const rateCheck = await checkRateLimit("decideWithProof", ip)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
                { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
            )
        }

        const body = await req.json() as DecideWithProofRequest

        // Validate input
        if (!body.subject || typeof body.subject !== "string") {
            return NextResponse.json(
                { code: "INVALID_REQUEST", message: "Subject is required" },
                { status: 400 }
            )
        }

        if (!body.context || typeof body.context !== "string") {
            return NextResponse.json(
                { code: "INVALID_REQUEST", message: "Context is required" },
                { status: 400 }
            )
        }

        if (!VALID_CONTEXTS.includes(body.context as DecisionContext)) {
            return NextResponse.json(
                {
                    code: "INVALID_REQUEST",
                    message: `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
                },
                { status: 400 }
            )
        }

        const result = await executeDecideWithProof({
            subject: body.subject,
            context: body.context as DecisionContext,
            apiKeyHash: req.headers.get("x-basecred-key-id") ?? undefined,
        })

        // Strip timing from response (internal-only)
        const { timing: _timing, ...response } = result

        return NextResponse.json(response)
    } catch (error: unknown) {
        console.error("Decide with proof error:", error)

        if (error instanceof CircuitNotAvailableError) {
            return NextResponse.json(
                { code: "ZK_NOT_CONFIGURED", message: "ZK circuit files are not available. Check ZK_CIRCUIT_WASM_PATH and ZK_CIRCUIT_ZKEY_PATH." },
                { status: 503 }
            )
        }

        if (error instanceof PolicyNotFoundError) {
            return NextResponse.json(
                { code: "POLICY_NOT_FOUND", message: error.message },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
