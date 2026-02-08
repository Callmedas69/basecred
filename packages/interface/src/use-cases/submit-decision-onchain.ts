/**
 * Submit Decision On-Chain Use Case
 *
 * Orchestrates on-chain submission of a verified decision with ZK proof.
 * Follows architecture rules: Business Logic layer decides and orchestrates.
 */

import type { Hash } from "viem"
import type { DecisionContext, Decision } from "basecred-decision-engine"
import {
    encodeContextId,
    encodeDecision,
    policyHashToFieldElement,
    policyHashToBytes32,
    contextToBytes32,
    subjectToBytes32,
    stringProofToContract,
    type ContractProofStrings,
} from "basecred-decision-engine"
import type { IDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"

// =============================================================================
// Input/Output Types
// =============================================================================

export interface SubmitDecisionOnChainInput {
    /** Subject identifier (wallet address or FID) */
    subject: string
    /** Decision context */
    context: DecisionContext
    /** Decision result */
    decision: Decision
    /** Policy hash (with sha256: prefix) */
    policyHash: string
    /** Proof in string format (for JSON transport) */
    proof: ContractProofStrings
    /** Public signals as strings (for JSON transport) */
    publicSignals: [string, string, string]
}

export interface SubmitDecisionOnChainOutput {
    /** Transaction hash */
    transactionHash: Hash
    /** Subject hash used in the submission */
    subjectHash: `0x${string}`
    /** Context bytes32 used in the submission */
    contextBytes32: `0x${string}`
    /** Policy hash bytes32 used in the submission */
    policyHashBytes32: `0x${string}`
}

export interface SubmitDecisionOnChainDependencies {
    decisionRegistryRepository: IDecisionRegistryRepository
}

// =============================================================================
// Use Case Implementation
// =============================================================================

/**
 * Submit a verified decision with ZK proof to the on-chain registry.
 *
 * This use case:
 * 1. Validates input parameters
 * 2. Encodes subject, context, decision, and policy hash to contract format
 * 3. Converts proof from string format to bigint format
 * 4. Validates public signals match encoded values
 * 5. Submits to the DecisionRegistry contract
 *
 * @param input The submission input (subject, context, decision, proof, publicSignals)
 * @param deps Dependencies (decisionRegistryRepository)
 * @returns Transaction hash and encoded values
 */
export async function submitDecisionOnChain(
    input: SubmitDecisionOnChainInput,
    deps: SubmitDecisionOnChainDependencies
): Promise<SubmitDecisionOnChainOutput> {
    // Encode values for contract
    const subjectHash = subjectToBytes32(input.subject)
    const contextBytes32 = contextToBytes32(input.context)
    const policyHashBytes32 = policyHashToBytes32(input.policyHash)
    const decisionValue = encodeDecision(input.decision)

    // Convert proof from strings to bigints
    const proof = stringProofToContract(input.proof)

    // Convert public signals from strings to bigints
    const publicSignals: [bigint, bigint, bigint] = [
        BigInt(input.publicSignals[0]),
        BigInt(input.publicSignals[1]),
        BigInt(input.publicSignals[2]),
    ]

    // Validate public signals match encoded values
    const expectedPolicyHash = policyHashToFieldElement(input.policyHash)
    const expectedContextId = BigInt(encodeContextId(input.context))
    const expectedDecision = BigInt(decisionValue)

    if (publicSignals[0] !== expectedPolicyHash) {
        throw new Error(
            `Public signal policyHash mismatch. Expected ${expectedPolicyHash}, got ${publicSignals[0]}`
        )
    }

    if (publicSignals[1] !== expectedContextId) {
        throw new Error(
            `Public signal contextId mismatch. Expected ${expectedContextId}, got ${publicSignals[1]}`
        )
    }

    if (publicSignals[2] !== expectedDecision) {
        throw new Error(
            `Public signal decision mismatch. Expected ${expectedDecision}, got ${publicSignals[2]}`
        )
    }

    // Submit to contract
    const transactionHash = await deps.decisionRegistryRepository.submitDecision({
        subjectHash,
        context: contextBytes32,
        decision: decisionValue,
        policyHash: policyHashBytes32,
        a: proof.a,
        b: proof.b,
        c: proof.c,
        publicSignals,
    })

    return {
        transactionHash,
        subjectHash,
        contextBytes32,
        policyHashBytes32,
    }
}
