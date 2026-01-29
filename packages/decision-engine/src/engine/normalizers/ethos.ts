/**
 * Ethos Signal Normalizer
 * 
 * Maps Ethos credibility scores to trust Tier.
 * Ethos is the source of truth for long-term trust/credibility.
 */

import type { Tier } from "../../types/tiers"

// ============================================================================
// Ethos Response Types
// ============================================================================

export type EthosAvailability = "available" | "not_found" | "unlinked" | "error"

export interface EthosProfile {
    availability: EthosAvailability
    credibility_score?: number
    review_count?: number
    vouch_count?: number
}

// ============================================================================
// Normalization Thresholds
// ============================================================================

/**
 * Threshold configuration for Ethos → Tier mapping.
 * These values can be tuned based on observed distributions.
 * Thresholds lowered by 40 for more accessible tiers.
 */
const ETHOS_THRESHOLDS = {
    VERY_HIGH: 40,  // was 80
    HIGH: 20,       // was 60
    NEUTRAL: 0,     // was 40
    LOW: -20,       // was 20 (effectively unused since scores are 0+)
    // Below LOW → VERY_LOW
} as const

// ============================================================================
// Normalizer Function
// ============================================================================

/**
 * Normalize Ethos credibility score to a trust Tier.
 * 
 * @param profile - Ethos profile data (may be null or unavailable)
 * @returns Trust Tier, or null if data is unavailable
 * 
 * @example
 * normalizeEthosTrust({ availability: "available", credibility_score: 75 })
 * // Returns "HIGH"
 * 
 * @example
 * normalizeEthosTrust(null)
 * // Returns null
 */
export function normalizeEthosTrust(profile: EthosProfile | any | null): Tier | null {
    // Handle missing or unavailable profiles
    if (!profile) return null

    let score: number | undefined

    // Check for SDK format first (nested data.score)
    if (profile.data && typeof profile.data.score === 'number') {
        score = profile.data.score
    } 
    // Check for legacy/raw format
    else if (profile.availability === "available" && typeof profile.credibility_score === 'number') {
        score = profile.credibility_score
    }

    if (score === undefined) return null

    // Map score to tier using thresholds
    if (score >= ETHOS_THRESHOLDS.VERY_HIGH) return "VERY_HIGH"
    if (score >= ETHOS_THRESHOLDS.HIGH) return "HIGH"
    if (score >= ETHOS_THRESHOLDS.NEUTRAL) return "NEUTRAL"
    if (score >= ETHOS_THRESHOLDS.LOW) return "LOW"
    return "VERY_LOW"
}

/**
 * Check if an Ethos profile is available for normalization.
 */
export function isEthosAvailable(profile: EthosProfile | any | null): boolean {
    if (!profile) return false
    
    // SDK format (implicit availability via existence of data)
    if (profile.data && typeof profile.data.score === 'number') return true
    
    // Legacy format
    return profile.availability === "available"
}
