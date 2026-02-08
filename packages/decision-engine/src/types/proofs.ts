import type { NormalizedSignals } from "./signals"
import type { DecisionContext } from "./decisions"

export interface ProofPublicInputs {
    policyHash: string
    normalizationVersion?: string
    context?: DecisionContext | string
    thresholds?: Record<string, string | number>
    [key: string]: unknown
}

export interface ProofPayload {
    proof: unknown
}

export interface VerifiedProof {
    valid: boolean
    signals?: NormalizedSignals
    error?: string
}

export interface ProofVerifier {
    verify: (
        proof: ProofPayload,
        publicInputs: ProofPublicInputs
    ) => Promise<VerifiedProof>
}
