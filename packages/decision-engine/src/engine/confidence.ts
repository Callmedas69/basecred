/**
 * Confidence Mapping
 * 
 * Maps numeric confidence scores to categorical tiers.
 * Base confidence is 50, modified by rule confidenceDelta values.
 */

import type { ConfidenceTier } from "../types/decisions"

// ============================================================================
// Confidence Thresholds
// ============================================================================

/**
 * Thresholds for mapping numeric confidence to tiers.
 * Base confidence is 50, so:
 * - 50 + 30 = 80 → VERY_HIGH
 * - 50 + 10 = 60 → HIGH
 * - 50 - 10 = 40 → MEDIUM
 * - 50 - 100 = -50 → LOW
 */
const CONFIDENCE_THRESHOLDS = {
    VERY_HIGH: 80,
    HIGH: 60,
    MEDIUM: 40,
    // Below MEDIUM → LOW
} as const

// ============================================================================
// Mapping Function
// ============================================================================

/**
 * Map a numeric confidence score to a categorical tier.
 * 
 * @param numericConfidence - Numeric confidence (base 50 + deltas)
 * @returns Categorical confidence tier
 * 
 * @example
 * mapConfidence(80) // "VERY_HIGH"
 * mapConfidence(65) // "HIGH"
 * mapConfidence(45) // "MEDIUM"
 * mapConfidence(20) // "LOW"
 */
export function mapConfidence(numericConfidence: number): ConfidenceTier {
    if (numericConfidence >= CONFIDENCE_THRESHOLDS.VERY_HIGH) return "VERY_HIGH"
    if (numericConfidence >= CONFIDENCE_THRESHOLDS.HIGH) return "HIGH"
    if (numericConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "MEDIUM"
    return "LOW"
}

/**
 * Get the numeric threshold for a confidence tier.
 * Useful for testing and documentation.
 */
export function getConfidenceThreshold(tier: ConfidenceTier): number {
    switch (tier) {
        case "VERY_HIGH":
            return CONFIDENCE_THRESHOLDS.VERY_HIGH
        case "HIGH":
            return CONFIDENCE_THRESHOLDS.HIGH
        case "MEDIUM":
            return CONFIDENCE_THRESHOLDS.MEDIUM
        case "LOW":
            return 0
    }
}

// ============================================================================
// Constants
// ============================================================================

/** Base confidence before any rule adjustments */
export const BASE_CONFIDENCE = 50
