/**
 * ZK Decision Use Case
 *
 * Orchestrates proof-based decisions:
 * 1. Fetch policy by context
 * 2. Verify proof against public inputs
 * 3. Evaluate rules using verified signals
 * 4. Return decision output
 */

import type { DecisionOutput, DecisionContext } from "../types/decisions"
import { VALID_CONTEXTS } from "../types/decisions"
import type { ProofPayload, ProofPublicInputs, ProofVerifier } from "../types/proofs"
import type { PolicyRepository } from "../repositories/policyRepository"
import { decide } from "../engine/decide"
import { deriveAccessStatus, resolveBlockingFactors, deriveBlockingFactorsForContext } from "../engine/progression"
import { isHardDenyRule } from "../engine/rules"

export interface DecideWithProofUseCaseInput {
    subject?: string
    context: DecisionContext
    proof: ProofPayload
    publicInputs: ProofPublicInputs
}

export interface DecideWithProofUseCaseDependencies {
    policyRepository: PolicyRepository
    proofVerifier: ProofVerifier
}

export interface DecideWithProofUseCaseOutput extends DecisionOutput {
    subjectHash?: string
    policyHash: string
}

export async function executeDecisionWithProof(
    input: DecideWithProofUseCaseInput,
    deps: DecideWithProofUseCaseDependencies
): Promise<DecideWithProofUseCaseOutput> {
    if (!VALID_CONTEXTS.includes(input.context)) {
        throw new Error(
            `Invalid context. Must be one of: ${VALID_CONTEXTS.map((c) => `'${c}'`).join(", ")}`
        )
    }

    const policy = await deps.policyRepository.getPolicyByContext(input.context)
    if (!policy) {
        throw new Error(`Policy not found for context '${input.context}'`)
    }

    if (input.publicInputs.policyHash !== policy.policyHash) {
        throw new Error("Policy hash mismatch")
    }

    const verified = await deps.proofVerifier.verify(input.proof, input.publicInputs)
    if (!verified.valid || !verified.signals) {
        throw new Error(verified.error || "Invalid proof")
    }

    const decision = decide(verified.signals, input.context)

    const isHardDeny = decision.ruleIds.some((id) => isHardDenyRule(id))
    const accessStatus = deriveAccessStatus(decision.decision, { isHardDeny })
    const blockingSnapshot = resolveBlockingFactors(verified.signals)
    const blockingFactors = deriveBlockingFactorsForContext(input.context, blockingSnapshot)

    const subjectHash = input.subject ? hashSubject(input.subject) : undefined

    return {
        ...decision,
        accessStatus,
        blockingFactors,
        subjectHash,
        policyHash: policy.policyHash,
    }
}

function hashSubject(subject: string): string {
    let hash = 0
    for (let i = 0; i < subject.length; i++) {
        const char = subject.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return `subj_${Math.abs(hash).toString(16)}`
}
