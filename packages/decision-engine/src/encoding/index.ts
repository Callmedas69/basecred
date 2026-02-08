/**
 * Encoding Module
 *
 * Provides utilities for converting between decision engine types
 * and circuit/contract-compatible values.
 */

// Context encoding
export {
    CONTEXT_ID_MAP,
    encodeContextId,
    decodeContextId,
    contextToBytes32,
} from "./context"

// Decision encoding
export {
    DECISION_VALUE_MAP,
    encodeDecision,
    decodeDecision,
} from "./decision"

// Signal encoding
export type { CircuitSignals } from "./signals"
export {
    encodeTier,
    decodeTier,
    encodeCapability,
    decodeCapability,
    signalCoverageToBps,
    bpsToSignalCoverage,
    encodeSignalsForCircuit,
} from "./signals"

// Policy hash encoding
export {
    BN254_FIELD_ORDER,
    stripPolicyHashPrefix,
    policyHashToFieldElement,
    policyHashToBytes32,
    isPolicyHashValidFieldElement,
} from "./policyHash"

// Proof format conversion
export type {
    SnarkjsProof,
    ContractProof,
    ContractProofStrings,
} from "./proof"
export {
    snarkjsProofToContract,
    snarkjsSignalsToContract,
    contractProofToStrings,
    stringProofToContract,
} from "./proof"

// Subject encoding
export {
    subjectToBytes32,
    isValidBytes32,
} from "./subject"
