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
    } catch (error: any) {
        const message = error?.message || "Unknown error"
        const status = resolveStatus(message)

        return NextResponse.json(
            { code: "DECISION_ERROR", message },
            { status }
        )
    }
}

function resolveStatus(message: string): number {
    if (message.startsWith("Invalid context")) return 400
    if (message.startsWith("Policy not found")) return 404
    if (message.includes("Policy hash mismatch")) return 409
    if (message.includes("Invalid proof")) return 400
    if (message.includes("Missing signals")) return 400
    return 500
}
