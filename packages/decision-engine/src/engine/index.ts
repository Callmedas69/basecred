/**
 * Decision Engine
 * 
 * Central export point for the engine module.
 */

// Core decision function
export { decide, ENGINE_VERSION } from "./decide"
export { mapConfidence, BASE_CONFIDENCE, getConfidenceThreshold } from "./confidence"

// Signal normalization
export {
    normalizeSignals,
    calculateSignalCoverage,
    calculateRecencyDays,
    normalizeEthosTrust,
    normalizeNeynarSocialTrust,
    normalizeNeynarSpamRisk,
    normalizeTalentBuilder,
    normalizeTalentCreator,
} from "./normalizers"
export type { UnifiedProfileData } from "./normalizers"

// Rules
export {
    FALLBACK_RULES,
    HARD_DENY_RULES,
    ALLOW_RULES,
    ALLOW_WITH_LIMITS_RULES,
    ALL_RULES,
    getRulesForContext,
    getRuleById,
    getAllContexts,
} from "./rules"
