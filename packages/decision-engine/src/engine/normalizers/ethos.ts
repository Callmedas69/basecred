/**
 * Ethos Signal Normalizer (SDK schema)
 *
 * Maps Ethos credibility scores to trust Tier.
 * Ethos is the source of truth for long-term trust/credibility.
 */

import type { Tier } from "../../types/tiers"

// ============================================================================
// Ethos Response Types
// ============================================================================

export interface EthosProfile {
    data?: {
        score?: number
    }
    signals?: {
        hasNegativeReviews?: boolean
        hasVouches?: boolean
    }
    meta?: {
        firstSeenAt?: string | null
        lastUpdatedAt?: string | null
        activeSinceDays?: number | null
        lastUpdatedDaysAgo?: number | null
    }
}

// ============================================================================
// Normalization Thresholds
// ============================================================================

/**
 * Threshold configuration for Ethos → Tier mapping.
 * These values can be tuned based on observed distributions.
 * Lowered to make tiers more accessible for real users.
 */
const ETHOS_THRESHOLDS = {
    VERY_HIGH: 1800, // Distinguished+
    HIGH: 1250,      // Established - Exemplary
    NEUTRAL: 900,    // Neutral - Known
    LOW: 550,        // Questionable
    // Below LOW → VERY_LOW (Untrusted)
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
 * normalizeEthosTrust({ data: { score: 75 } })
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

    if (profile.data && typeof profile.data.score === 'number') {
        score = profile.data.score
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

    return !!(profile.data && typeof profile.data.score === 'number')
}
