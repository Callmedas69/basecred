/**
 * Farcaster Signal Normalizer (SDK schema)
 *
 * Maps Farcaster user quality to socialTrust and spamRisk Tiers.
 * Farcaster quality is sourced from the SDK `farcaster.data.userScore`.
 */

import type { Tier } from "../../types/tiers"

// ============================================================================
// Neynar Response Types
// ============================================================================

export interface FarcasterProfile {
    data?: {
        /** Farcaster user quality score (0-1) */
        userScore?: number
    }
    signals?: {
        passesQualityThreshold?: boolean
    }
    meta?: {
        source?: string
        scope?: string
        lastUpdatedAt?: string | null
        lastUpdatedDaysAgo?: number | null
        updateCadence?: string
        timeMeaning?: string
    }
}

// ============================================================================
// Normalization Thresholds
// ============================================================================

/**
 * Threshold configuration for Farcaster → socialTrust mapping.
 * Based on `farcaster.data.userScore` (0-1 scale).
 */
const SOCIAL_TRUST_THRESHOLDS = {
    VERY_HIGH: 0.9,
    HIGH: 0.7,
    NEUTRAL: 0.4,
    LOW: 0.2,
    // Below LOW → VERY_LOW
} as const

/**
 * Threshold configuration for Farcaster → spamRisk mapping.
 * Inverse of quality score (high quality = low spam risk).
 */
const SPAM_RISK_THRESHOLDS = {
    VERY_LOW: 0.8,   // high quality = very low spam risk
    LOW: 0.6,
    NEUTRAL: 0.4,
    HIGH: 0.2,
    // Below HIGH → VERY_HIGH spam risk
} as const

// ============================================================================
// Normalizer Functions
// ============================================================================

/**
 * Normalize Farcaster user quality to socialTrust Tier.
 *
 * @param profile - Farcaster profile data (may be null)
 * @returns socialTrust Tier, or null if data is unavailable
 * 
 * @example
 * normalizeNeynarSocialTrust({ data: { userScore: 0.85 } })
 * // Returns "HIGH"
 */
export function normalizeNeynarSocialTrust(profile: FarcasterProfile | any | null): Tier | null {
    if (!profile) return null

    let score: number | undefined

    if (profile.data && typeof profile.data.userScore === 'number') {
        score = profile.data.userScore
    }

    if (score === undefined) return null

    if (score >= SOCIAL_TRUST_THRESHOLDS.VERY_HIGH) return "VERY_HIGH"
    if (score >= SOCIAL_TRUST_THRESHOLDS.HIGH) return "HIGH"
    if (score >= SOCIAL_TRUST_THRESHOLDS.NEUTRAL) return "NEUTRAL"
    if (score >= SOCIAL_TRUST_THRESHOLDS.LOW) return "LOW"
    return "VERY_LOW"
}

/**
 * Normalize Farcaster user quality to spamRisk Tier.
 * Note: This is INVERSE of quality - high quality = low spam risk.
 *
 * @param profile - Farcaster profile data (may be null)
 * @returns spamRisk Tier, or null if data is unavailable
 * 
 * @example
 * normalizeNeynarSpamRisk({ data: { userScore: 0.85 } })
 * // Returns "VERY_LOW" (high quality = low spam)
 */
export function normalizeNeynarSpamRisk(profile: FarcasterProfile | any | null): Tier | null {
    if (!profile) return null

    let score: number | undefined

    if (profile.data && typeof profile.data.userScore === 'number') {
        score = profile.data.userScore
    }

    if (score === undefined) return null

    // Inverse mapping: high score = low spam risk
    if (score >= SPAM_RISK_THRESHOLDS.VERY_LOW) return "VERY_LOW"
    if (score >= SPAM_RISK_THRESHOLDS.LOW) return "LOW"
    if (score >= SPAM_RISK_THRESHOLDS.NEUTRAL) return "NEUTRAL"
    if (score >= SPAM_RISK_THRESHOLDS.HIGH) return "HIGH"
    return "VERY_HIGH"
}

/**
 * Check if a Farcaster profile is available for normalization.
 */
export function isNeynarAvailable(profile: FarcasterProfile | any | null): boolean {
    if (!profile) return false

    return !!(profile.data && typeof profile.data.userScore === 'number')
}
