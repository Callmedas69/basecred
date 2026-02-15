/**
 * BaseCred Decision Engine
 *
 * Main entry point for the SDK.
 */

// Types
export * from "./types"

// Encoding (for circuit/contract integration)
export * from "./encoding"

// Engine
export {
    decide,
    ENGINE_VERSION,
    mapConfidence,
    BASE_CONFIDENCE,
    normalizeSignals,
    calculateSignalCoverage,
    ALL_RULES,
    getRulesForContext,
    getRuleById,
    getAllContexts,
    resolveBlockingFactors,
    deriveBlockingFactorsForContext,
} from "./engine"
export type { UnifiedProfileData, BlockingFactorSnapshot } from "./engine"

// Repositories
export type { PolicyDefinition, PolicyRepository } from "./repositories"
export { InMemoryPolicyRepository } from "./repositories"

// Use Cases
export {
    executeDecision,
    validateDecideRequest,
    type DecideUseCaseInput,
    type DecideUseCaseOutput,
    executeDecisionWithProof,
    type DecideWithProofUseCaseInput,
    type DecideWithProofUseCaseDependencies,
    type DecideWithProofUseCaseOutput,
    listPolicies,
    type ListPoliciesUseCaseDependencies,
} from "./use-cases"
