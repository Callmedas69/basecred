/**
 * ZK Proof Generator
 *
 * Server-side helper for generating Groth16 ZK proofs using snarkjs.
 * Loads circuit WASM and ZKey files, prepares witness input, and generates proofs.
 */

import { access } from "fs/promises"
import path from "path"
import type { CircuitSignals, ContractProofStrings, SnarkjsProof } from "basecred-decision-engine"
import {
    snarkjsProofToContract,
    contractProofToStrings,
    decodeDecision,
    policyHashToFieldElement,
} from "basecred-decision-engine"
import type { Decision } from "basecred-decision-engine"

// Circuit file paths
// When running via `pnpm --filter interface dev`, cwd is packages/interface
// So we need to go up to monorepo root first
const CIRCUIT_WASM_PATH = process.env.ZK_CIRCUIT_WASM_PATH ||
    path.join(process.cwd(), "..", "contracts", "circuits", "build", "DecisionCircuit_js", "DecisionCircuit.wasm")
const CIRCUIT_ZKEY_PATH = process.env.ZK_CIRCUIT_ZKEY_PATH ||
    path.join(process.cwd(), "..", "contracts", "circuits", "circuit_final.zkey")

// Cached snarkjs module — lazy singleton to avoid re-importing every request
let snarkjsPromise: Promise<typeof import("snarkjs")> | null = null
function getSnarkjs() {
    if (!snarkjsPromise) {
        snarkjsPromise = import("snarkjs")
    }
    return snarkjsPromise
}

// Cached circuit file availability — files are static, check once
let circuitFilesAvailable: boolean | null = null

export interface ProofGenerationInput {
    /** Encoded signals for circuit (numeric values) */
    circuitSignals: CircuitSignals
    /** Policy hash string (with or without sha256: prefix) */
    policyHash: string
    /** Context ID (0-4) */
    contextId: number
}

export interface GeneratedProof {
    /** Proof in contract-compatible string format */
    proof: ContractProofStrings
    /** Public signals as strings [policyHash, contextId, decision] */
    publicSignals: [string, string, string]
    /** Decoded decision from circuit output */
    decision: Decision
}

/**
 * Generate a Groth16 ZK proof for a decision.
 *
 * The circuit computes the decision internally based on the signals and context.
 * The decision is returned as a public output (not computed by this function).
 *
 * @param input Circuit signals, policy hash, and context ID
 * @returns Generated proof with public signals and decoded decision
 */
export async function generateProof(input: ProofGenerationInput): Promise<GeneratedProof> {
    const { groth16 } = await getSnarkjs()

    // Prepare witness input
    // The circuit expects policyHash as a field element
    const policyHashField = policyHashToFieldElement(input.policyHash)

    // Pre-compute expected decision using circuit logic
    // The circuit will verify this matches
    const expectedDecision = computeExpectedDecision(input.circuitSignals, input.contextId)

    const witnessInput = {
        // Public inputs
        policyHash: policyHashField.toString(),
        contextId: input.contextId,
        decision: expectedDecision,
        // Private inputs (signals)
        trust: input.circuitSignals.trust,
        socialTrust: input.circuitSignals.socialTrust,
        builder: input.circuitSignals.builder,
        creator: input.circuitSignals.creator,
        recencyDays: input.circuitSignals.recencyDays,
        spamRisk: input.circuitSignals.spamRisk,
        signalCoverageBps: input.circuitSignals.signalCoverageBps,
    }

    // Generate proof - snarkjs expects file paths as strings
    const { proof: snarkjsProof, publicSignals } = await groth16.fullProve(
        witnessInput,
        CIRCUIT_WASM_PATH,
        CIRCUIT_ZKEY_PATH
    ) as { proof: SnarkjsProof; publicSignals: string[] }

    // Convert proof to contract format
    const contractProof = snarkjsProofToContract(snarkjsProof)
    const proofStrings = contractProofToStrings(contractProof)

    // Decode decision from public output
    // Public signals are [policyHash, contextId, decision]
    const decisionValue = parseInt(publicSignals[2], 10)
    const decision = decodeDecision(decisionValue)

    return {
        proof: proofStrings,
        publicSignals: [publicSignals[0], publicSignals[1], publicSignals[2]] as [string, string, string],
        decision,
    }
}

/**
 * Compute the expected decision value based on circuit logic.
 *
 * This replicates the circuit's decision computation to prepare the witness.
 * The circuit will verify the decision matches the signals.
 *
 * Decision encoding:
 * - 0 = DENY
 * - 1 = ALLOW_WITH_LIMITS
 * - 2 = ALLOW
 */
function computeExpectedDecision(signals: CircuitSignals, contextId: number): number {
    const { trust, socialTrust, builder, creator, recencyDays, spamRisk, signalCoverageBps } = signals

    // Fallback: no signals
    if (signalCoverageBps === 0) {
        return 0 // DENY
    }

    // Fallback: partial signals (< 50%)
    if (signalCoverageBps < 5000) {
        return 1 // ALLOW_WITH_LIMITS
    }

    // Hard deny checks
    const spamGteHigh = spamRisk >= 3
    const socialLtNeutral = socialTrust < 2
    const trustIsVeryLow = trust === 0

    if (spamGteHigh || socialLtNeutral || trustIsVeryLow) {
        return 0 // DENY
    }

    // Helper comparisons
    const trustGteNeutral = trust >= 2
    const trustGteHigh = trust >= 3
    const socialGteNeutral = socialTrust >= 2
    const socialGteHigh = socialTrust >= 3
    const builderGteBuilder = builder >= 1
    const builderGteExpert = builder >= 2
    const creatorGteBuilder = creator >= 1
    const creatorGteExpert = creator >= 2
    const builderIsElite = builder === 3
    const creatorIsElite = creator === 3
    const builderIsExplorer = builder === 0
    const creatorIsExplorer = creator === 0
    const socialGteLow = socialTrust >= 1

    // Context-specific ALLOW rules
    let allowAny = false

    // Allowlist context (0)
    if (contextId === 0) {
        const strongBuilder = builderIsElite || (builderGteExpert && socialGteHigh)
        const strongCreator = creatorIsElite || (creatorGteExpert && socialGteHigh)
        const highTrust = trustGteHigh && socialGteHigh
        if (strongBuilder || strongCreator || highTrust) {
            allowAny = true
        }
    }

    // Comment context (1)
    if (contextId === 1) {
        if (trustGteNeutral && socialGteNeutral) {
            allowAny = true
        }
    }

    // Publish context (2)
    if (contextId === 2) {
        const hasCapability = builderGteBuilder || creatorGteBuilder
        if (trustGteHigh && socialGteHigh && hasCapability) {
            allowAny = true
        }
    }

    // Apply context (3)
    if (contextId === 3) {
        const hasExpertCapability = builderGteExpert || creatorGteExpert
        if (trustGteNeutral && hasExpertCapability) {
            allowAny = true
        }
    }

    // Governance context (4)
    if (contextId === 4) {
        const recencyLe30 = recencyDays <= 30
        if (trustGteHigh && socialGteNeutral && recencyLe30) {
            allowAny = true
        }
    }

    if (allowAny) {
        return 2 // ALLOW
    }

    // Context-specific ALLOW_WITH_LIMITS rules
    let allowWithLimitsAny = false

    // Allowlist probation rules (context 0)
    if (contextId === 0) {
        // Inactive probation: neutral trust but > 14 days inactive
        if (trustGteNeutral && recencyDays > 14) {
            allowWithLimitsAny = true
        }
        // New user probation: neutral trust/social but explorer capabilities
        if (trustGteNeutral && socialGteNeutral && builderIsExplorer && creatorIsExplorer) {
            allowWithLimitsAny = true
        }
        // Mixed signals probation: high trust but only low social
        if (trustGteHigh && socialGteLow) {
            allowWithLimitsAny = true
        }
    }

    // Comment new user limit (context 1)
    if (contextId === 1) {
        const covGteHalf = signalCoverageBps >= 5000
        if (socialGteLow && covGteHalf) {
            allowWithLimitsAny = true
        }
    }

    // Publish unverified limit (context 2)
    if (contextId === 2) {
        if (trustGteNeutral && socialGteNeutral) {
            allowWithLimitsAny = true
        }
    }

    // Governance inactive limit (context 4)
    if (contextId === 4) {
        const recencyGt30 = recencyDays > 30
        const recencyLe90 = recencyDays <= 90
        if (trustGteHigh && recencyGt30 && recencyLe90) {
            allowWithLimitsAny = true
        }
    }

    if (allowWithLimitsAny) {
        return 1 // ALLOW_WITH_LIMITS
    }

    // Default: DENY
    return 0
}

/**
 * Check if circuit files are available.
 * Useful for graceful degradation when ZK infrastructure isn't set up.
 */
export async function areCircuitFilesAvailable(): Promise<boolean> {
    // Return cached result if files were previously found (they're static assets)
    if (circuitFilesAvailable === true) {
        return true
    }

    try {
        console.log("[ZK] Checking circuit files...")
        console.log("[ZK] CWD:", process.cwd())
        console.log("[ZK] WASM path:", CIRCUIT_WASM_PATH)
        console.log("[ZK] ZKey path:", CIRCUIT_ZKEY_PATH)
        await Promise.all([
            access(CIRCUIT_WASM_PATH),
            access(CIRCUIT_ZKEY_PATH),
        ])
        console.log("[ZK] Circuit files found!")
        circuitFilesAvailable = true
        return true
    } catch (err) {
        console.error("[ZK] Circuit files not found:", err)
        // Don't cache failures — files might be deployed later
        return false
    }
}
