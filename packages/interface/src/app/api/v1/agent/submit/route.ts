import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { VALID_CONTEXTS, type DecisionContext, type Decision } from "basecred-decision-engine"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import { requireRelayerPrivateKey } from "@/lib/serverConfig"
import { toAppError } from "@/lib/errors"
import { logSubmissionFeed } from "@/use-cases/log-submission-feed"

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
        // API key required (validated by middleware, forwarded via x-basecred-key-id)
        const apiKeyHash = req.headers.get("x-basecred-key-id")
        if (!apiKeyHash) {
            return NextResponse.json(
                { code: "UNAUTHORIZED", message: "API key required" },
                { status: 401 }
            )
        }

        const relayerPrivateKey = requireRelayerPrivateKey()

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

        // Log to global feed (awaited — must complete before Vercel terminates)
        try {
            await logSubmissionFeed({
                apiKeyHash,
                subject,
                context,
                txHash: result.transactionHash,
            })
        } catch (err) {
            console.error("[agent/submit] Feed logging failed:", err)
        }

        return NextResponse.json({
            success: true,
            transactionHash: result.transactionHash,
            subjectHash: result.subjectHash,
            contextBytes32: result.contextBytes32,
            policyHashBytes32: result.policyHashBytes32,
        })
    } catch (error: unknown) {
        const appError = toAppError(error)
        console.error("Submit error:", appError.message)

        return NextResponse.json(
            { code: appError.code, message: appError.message },
            { status: appError.status }
        )
    }
}
