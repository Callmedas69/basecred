import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rateLimit"
import {
    executeDecisionWithProof,
    InMemoryPolicyRepository,
    type ProofPublicInputs,
    type ProofPayload,
    type ProofVerifier,
} from "basecred-decision-engine"
import { verifyGroth16Proof } from "@/lib/zkProofVerifier"
import { agentDecideRequestSchema } from "@/lib/agentSchemas"
import { toAppError } from "@/lib/errors"

const policyRepository = new InMemoryPolicyRepository()

const proofVerifier: ProofVerifier = {
    verify: verifyGroth16Proof,
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP — public proof verification endpoint
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        const rateCheck = await checkRateLimit("agentDecide", ip)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
                { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
            )
        }

        const body = await req.json()

        const parsed = agentDecideRequestSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { code: "INVALID_REQUEST", message: parsed.error.issues[0]?.message || "Invalid request" },
                { status: 400 }
            )
        }

        const { subject, context, proof, publicInputs } = parsed.data

        const result = await executeDecisionWithProof(
            {
                subject,
                context: context as any,
                proof: proof as ProofPayload,
                publicInputs: publicInputs as ProofPublicInputs,
            },
            {
                policyRepository,
                proofVerifier,
            }
        )

        const response = NextResponse.json(result)
        response.headers.set("x-policy-hash", result.policyHash)
        return response
    } catch (error: unknown) {
        const appError = toAppError(error)
        console.error("Decision error:", appError.message)
        return NextResponse.json(
            { code: appError.code, message: appError.message },
            { status: appError.status }
        )
    }
}
