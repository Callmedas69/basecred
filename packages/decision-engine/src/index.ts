/**
 * BaseCred Decision Engine
 * 
 * Main entry point for the SDK.
 */

// Types
export * from "./types"

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
} from "./engine"
export type { UnifiedProfileData } from "./engine"

// Use Cases
export {
    executeDecision,
    validateDecideRequest,
    type DecideUseCaseInput,
    type DecideUseCaseOutput,
} from "./use-cases"
