/**
 * Decide with ZK Proof — Use Case
 *
 * Core business logic for generating ZK-verified reputation decisions.
 *
 * Flow:
 * 1. Fetch SDK output (raw scores from Ethos, Neynar, Talent)
 * 2. Normalize signals using decision-engine normalizers
 * 3. Encode signals for circuit
 * 4. Generate ZK proof (circuit computes decision)
 * 5. Derive confidence/constraints/blocking factors
 * 6. Build explanation
 * 7. Auto-submit proof on-chain via relayer
 * 8. Log to global feed
 */

import {
    normalizeSignals,
    encodeSignalsForCircuit,
    encodeContextId,
    InMemoryPolicyRepository,
    listPolicies,
    resolveBlockingFactors,
    deriveBlockingFactorsForContext,
    type DecisionContext,
    type Decision,
    type NormalizedSignals,
    type ConfidenceTier,
} from "basecred-decision-engine"
import { fetchLiveProfile } from "@/repositories/liveProfileRepository"
import { generateProof, areCircuitFilesAvailable } from "@/lib/proofGenerator"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { getRelayerPrivateKey } from "@/lib/serverConfig"
import { extractRevertReason } from "@/lib/errors"
import { logSubmissionFeed } from "@/use-cases/log-submission-feed"
import { deriveConstraintsForContext, buildExplanation } from "@/lib/decisionHelpers"

const policyRepository = new InMemoryPolicyRepository()

export interface DecideWithProofInput {
    subject: string
    context: DecisionContext
    apiKeyHash?: string
}

export interface DecideWithProofOutput {
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"
    confidence: ConfidenceTier
    constraints: string[]
    blockingFactors?: string[]
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
    onChain: {
        submitted: boolean
        txHash?: string
        error?: string
    }
    timing: {
        fetchMs: number
        normEncodeMs: number
        proofMs: number
        totalMs: number
    }
}

export class CircuitNotAvailableError extends Error {
    constructor() {
        super("ZK circuit files are not available")
        this.name = "CircuitNotAvailableError"
    }
}

export class PolicyNotFoundError extends Error {
    constructor(context: string) {
        super(`No policy found for context: ${context}`)
        this.name = "PolicyNotFoundError"
    }
}

export async function executeDecideWithProof(
    input: DecideWithProofInput
): Promise<DecideWithProofOutput> {
    const t0 = performance.now()

    // Check circuit files
    const circuitAvailable = await areCircuitFilesAvailable()
    if (!circuitAvailable) {
        throw new CircuitNotAvailableError()
    }

    // Get policy for this context
    const policies = await listPolicies({ policyRepository })
    const policy = policies.find((p) => p.context === input.context)
    if (!policy) {
        throw new PolicyNotFoundError(input.context)
    }

    // 1. Fetch SDK output (raw scores)
    const tFetch = performance.now()
    const profile = await fetchLiveProfile(input.subject)
    const fetchMs = performance.now() - tFetch

    // 2. Normalize signals
    const tNorm = performance.now()
    const signals = normalizeSignals(profile)

    // 3. Encode for circuit
    const circuitSignals = encodeSignalsForCircuit(signals)
    const contextId = encodeContextId(input.context)
    const normEncodeMs = performance.now() - tNorm

    // 4. Generate ZK proof (circuit computes decision)
    const tProof = performance.now()
    const proofResult = await generateProof({
        circuitSignals,
        policyHash: policy.policyHash,
        contextId,
    })
    const proofMs = performance.now() - tProof

    // 5. Derive confidence, constraints, and blocking factors
    const confidence: ConfidenceTier = "HIGH"
    const constraints = deriveConstraintsForContext(proofResult.decision, input.context)
    const blockingSnapshot = resolveBlockingFactors(signals)
    const blockingFactors = proofResult.decision === "DENY"
        ? deriveBlockingFactorsForContext(input.context, blockingSnapshot, signals)
        : undefined

    // 6. Build explanation
    const explain = buildExplanation(proofResult.decision, signals, input.context)

    // 7. Auto-submit on-chain
    let onChain: DecideWithProofOutput["onChain"] = { submitted: false, error: "Relayer not configured" }

    const relayerKey = getRelayerPrivateKey()
    if (relayerKey) {
        try {
            const registryRepo = createDecisionRegistryRepository(relayerKey)
            const output = await submitDecisionOnChain(
                {
                    subject: input.subject,
                    context: input.context,
                    decision: proofResult.decision as Decision,
                    policyHash: policy.policyHash,
                    proof: proofResult.proof,
                    publicSignals: proofResult.publicSignals,
                },
                { decisionRegistryRepository: registryRepo }
            )
            onChain = { submitted: true, txHash: output.transactionHash }
        } catch (err: unknown) {
            const reason = extractRevertReason(err)
            console.error(`[decide-with-proof] On-chain submit failed for ${input.context}: ${reason}`)
            onChain = { submitted: false, error: reason }
        }
    }

    // 8. Log to global feed (best-effort)
    if (input.apiKeyHash && onChain.txHash) {
        try {
            await logSubmissionFeed({
                apiKeyHash: input.apiKeyHash,
                subject: input.subject,
                context: input.context,
                txHash: onChain.txHash,
            })
        } catch (err) {
            console.error("[decide-with-proof] Feed logging failed:", err)
        }
    }

    const totalMs = performance.now() - t0

    console.log(
        `[ZK Timing] subject=${input.subject} context=${input.context} | ` +
        `fetch=${fetchMs.toFixed(0)}ms norm+encode=${normEncodeMs.toFixed(0)}ms ` +
        `proof=${proofMs.toFixed(0)}ms total=${totalMs.toFixed(0)}ms`
    )

    return {
        decision: proofResult.decision,
        confidence,
        constraints,
        ...(blockingFactors !== undefined && { blockingFactors }),
        signals,
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        policyHash: policy.policyHash,
        contextId,
        explain,
        onChain,
        timing: { fetchMs, normEncodeMs, proofMs, totalMs },
    }
}
