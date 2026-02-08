import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { VALID_CONTEXTS, type DecisionContext, type Decision } from "basecred-decision-engine"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"

// =============================================================================
// Request Validation Schema
// =============================================================================

const FALLBACK_CONTEXTS = [
    "allowlist.general",
    "apply",
    "comment",
    "publish",
    "governance.vote",
]

const CONTEXTS = Array.isArray(VALID_CONTEXTS) && VALID_CONTEXTS.length > 0
    ? VALID_CONTEXTS
    : FALLBACK_CONTEXTS

const VALID_DECISIONS = ["ALLOW", "DENY", "ALLOW_WITH_LIMITS"] as const

const proofSchema = z.object({
    a: z.tuple([z.string(), z.string()]),
    b: z.tuple([
        z.tuple([z.string(), z.string()]),
        z.tuple([z.string(), z.string()]),
    ]),
    c: z.tuple([z.string(), z.string()]),
})

const submitRequestSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    context: z.string().refine((value) => CONTEXTS.includes(value as any), {
        message: `Invalid context. Must be one of: ${CONTEXTS.map((c) => `'${c}'`).join(", ")}`,
    }),
    decision: z.enum(VALID_DECISIONS),
    policyHash: z.string().min(1, "Policy hash is required"),
    proof: proofSchema,
    publicSignals: z.tuple([z.string(), z.string(), z.string()]),
})

export type SubmitRequest = z.infer<typeof submitRequestSchema>

// =============================================================================
// API Endpoint
// =============================================================================

export async function POST(req: NextRequest) {
    try {
        // Validate relayer key is configured
        const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
        if (!relayerPrivateKey) {
            return NextResponse.json(
                { code: "CONFIG_ERROR", message: "Relayer not configured" },
                { status: 503 }
            )
        }

        // Parse and validate request body
        const body = await req.json()
        const parsed = submitRequestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                {
                    code: "INVALID_REQUEST",
                    message: parsed.error.issues[0]?.message || "Invalid request",
                    details: parsed.error.issues,
                },
                { status: 400 }
            )
        }

        const { subject, context, decision, policyHash, proof, publicSignals } = parsed.data

        // Create repository with relayer wallet
        const decisionRegistryRepository = createDecisionRegistryRepository(relayerPrivateKey)

        // Submit decision on-chain
        const result = await submitDecisionOnChain(
            {
                subject,
                context: context as DecisionContext,
                decision: decision as Decision,
                policyHash,
                proof,
                publicSignals,
            },
            {
                decisionRegistryRepository,
            }
        )

        return NextResponse.json({
            success: true,
            transactionHash: result.transactionHash,
            subjectHash: result.subjectHash,
            contextBytes32: result.contextBytes32,
            policyHashBytes32: result.policyHashBytes32,
        })
    } catch (error: any) {
        const message = error?.message || "Unknown error"
        const status = resolveStatus(message)

        console.error("Submit error:", message)

        return NextResponse.json(
            { code: "SUBMIT_ERROR", message },
            { status }
        )
    }
}

function resolveStatus(message: string): number {
    if (message.includes("mismatch")) return 400
    if (message.includes("Invalid")) return 400
    if (message.includes("not configured")) return 503
    if (message.includes("not initialized")) return 503
    if (message.includes("revert")) return 422
    return 500
}
