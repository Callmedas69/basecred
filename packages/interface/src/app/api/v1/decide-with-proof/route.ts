/**
 * Decide with ZK Proof API
 *
 * Generates ZK proofs for reputation decisions.
 *
 * Flow:
 * 1. Fetch SDK output (raw scores from Ethos, Neynar, Talent)
 * 2. Normalize signals using decision-engine normalizers
 * 3. Encode signals for circuit
 * 4. Generate ZK proof (circuit computes decision)
 * 5. Return decision, signals, and proof data
 */

// Force Node.js runtime (required for snarkjs WASM operations)
export const runtime = "nodejs"
// ZK proof generation is CPU-intensive — allow up to 60s
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import {
    normalizeSignals,
    encodeSignalsForCircuit,
    encodeContextId,
    decodeDecision,
    VALID_CONTEXTS,
    InMemoryPolicyRepository,
    listPolicies,
    type DecisionContext,
    type NormalizedSignals,
} from "basecred-decision-engine"
import { fetchLiveProfile } from "@/repositories/liveProfileRepository"
import { generateProof, areCircuitFilesAvailable } from "@/lib/proofGenerator"

const policyRepository = new InMemoryPolicyRepository()

interface DecideWithProofRequest {
    subject: string
    context: string
}

interface DecideWithProofResponse {
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
    signals: NormalizedSignals
    proof: {
        a: [string, string]
        b: [[string, string], [string, string]]
        c: [string, string]
    }
    publicSignals: [string, string, string]
    policyHash: string
    contextId: number
    explain: string[]
}

export async function POST(req: NextRequest) {
    const t0 = performance.now()

    try {
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

        const context = body.context as DecisionContext

        // Check if circuit files are available
        const circuitAvailable = await areCircuitFilesAvailable()
        if (!circuitAvailable) {
            return NextResponse.json(
                {
                    code: "ZK_NOT_CONFIGURED",
                    message: "ZK circuit files are not available. Check ZK_CIRCUIT_WASM_PATH and ZK_CIRCUIT_ZKEY_PATH.",
                },
                { status: 503 }
            )
        }

        // Get policy for this context
        const policies = await listPolicies({ policyRepository })
        const policy = policies.find((p) => p.context === context)
        if (!policy) {
            return NextResponse.json(
                { code: "POLICY_NOT_FOUND", message: `No policy found for context: ${context}` },
                { status: 404 }
            )
        }

        // 1. Fetch SDK output (raw scores)
        const tFetch = performance.now()
        const profile = await fetchLiveProfile(body.subject)
        const fetchMs = performance.now() - tFetch

        // 2. Normalize signals
        const tNorm = performance.now()
        const signals = normalizeSignals(profile)

        // 3. Encode for circuit
        const circuitSignals = encodeSignalsForCircuit(signals)
        const contextId = encodeContextId(context)
        const normEncodeMs = performance.now() - tNorm

        // 4. Generate ZK proof (circuit computes decision)
        const tProof = performance.now()
        const proofResult = await generateProof({
            circuitSignals,
            policyHash: policy.policyHash,
            contextId,
        })
        const proofMs = performance.now() - tProof

        // 5. Build explanation based on decision and signals
        const explain = buildExplanation(proofResult.decision, signals, context)

        const totalMs = performance.now() - t0

        console.log(
            `[ZK Timing] subject=${body.subject} context=${context} | ` +
            `fetch=${fetchMs.toFixed(0)}ms norm+encode=${normEncodeMs.toFixed(0)}ms ` +
            `proof=${proofMs.toFixed(0)}ms total=${totalMs.toFixed(0)}ms`
        )

        const response: DecideWithProofResponse = {
            decision: proofResult.decision,
            signals,
            proof: proofResult.proof,
            publicSignals: proofResult.publicSignals,
            policyHash: policy.policyHash,
            contextId,
            explain,
        }

        return NextResponse.json(response)
    } catch (error: any) {
        const totalMs = performance.now() - t0
        console.error(`Decide with proof error (${totalMs.toFixed(0)}ms):`, error)

        // Handle specific error types
        if (error.message?.includes("file")) {
            return NextResponse.json(
                { code: "ZK_ERROR", message: "Failed to load circuit files" },
                { status: 503 }
            )
        }

        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: error.message || "Unknown error" },
            { status: 500 }
        )
    }
}

/**
 * Build human-readable explanation for the decision.
 */
function buildExplanation(
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS",
    signals: NormalizedSignals,
    context: DecisionContext
): string[] {
    const reasons: string[] = []

    // Add signal summary
    reasons.push(`Trust level: ${signals.trust}`)
    reasons.push(`Social trust: ${signals.socialTrust}`)
    reasons.push(`Builder capability: ${signals.builder}`)
    reasons.push(`Creator capability: ${signals.creator}`)

    if (signals.spamRisk !== "NEUTRAL") {
        reasons.push(`Spam risk: ${signals.spamRisk}`)
    }

    if (signals.recencyDays > 0) {
        reasons.push(`Last activity: ${signals.recencyDays} days ago`)
    }

    reasons.push(`Signal coverage: ${Math.round(signals.signalCoverage * 100)}%`)

    // Add decision-specific reasoning
    if (decision === "ALLOW") {
        reasons.push(`Eligible for ${context} based on reputation signals.`)
    } else if (decision === "ALLOW_WITH_LIMITS") {
        reasons.push(`Limited access to ${context} - some criteria not fully met.`)
    } else {
        // DENY
        if (signals.signalCoverage < 0.5) {
            reasons.push("Insufficient signal coverage to make a confident decision.")
        } else if (signals.spamRisk === "HIGH" || signals.spamRisk === "VERY_HIGH") {
            reasons.push("High spam risk detected.")
        } else if (signals.trust === "VERY_LOW") {
            reasons.push("Trust level is too low for this context.")
        } else if (signals.socialTrust === "VERY_LOW" || signals.socialTrust === "LOW") {
            reasons.push("Social trust is below required threshold.")
        } else {
            reasons.push(`Requirements for ${context} not met.`)
        }
    }

    return reasons
}
