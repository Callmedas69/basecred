/**
 * Neynar Signal Normalizer
 * 
 * Maps Neynar user quality to socialTrust and spamRisk Tiers.
 * Neynar is the source of truth for Farcaster social behavior.
 */

import type { Tier } from "../../types/tiers"

// ============================================================================
// Neynar Response Types
// ============================================================================

export interface NeynarUser {
    fid?: number
    username?: string
    display_name?: string
    pfp_url?: string

    /** Farcaster user quality score (0-1) */
    farcaster_user_score?: number

    /** Follower count */
    follower_count?: number

    /** Following count */
    following_count?: number

    /** Whether the account is verified */
    verified?: boolean

    /** Account creation timestamp */
    registered_at?: string
}

// ============================================================================
// Normalization Thresholds
// ============================================================================

/**
 * Threshold configuration for Neynar → socialTrust mapping.
 * Based on farcaster_user_score (0-1 scale).
 */
const SOCIAL_TRUST_THRESHOLDS = {
    VERY_HIGH: 0.9,
    HIGH: 0.7,
    NEUTRAL: 0.4,
    LOW: 0.2,
    // Below LOW → VERY_LOW
} as const

/**
 * Threshold configuration for Neynar → spamRisk mapping.
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
 * Normalize Neynar user quality to socialTrust Tier.
 * 
 * @param user - Neynar user data (may be null)
 * @returns socialTrust Tier, or null if data is unavailable
 * 
 * @example
 * normalizeNeynarSocialTrust({ farcaster_user_score: 0.85 })
 * // Returns "HIGH"
 */
export function normalizeNeynarSocialTrust(user: NeynarUser | any | null): Tier | null {
    if (!user) return null

    let score: number | undefined

    // SDK format
    if (user.data && typeof user.data.userScore === 'number') {
        score = user.data.userScore
    } 
    // Legacy format
    else if (user.farcaster_user_score !== undefined) {
        score = user.farcaster_user_score
    }

    if (score === undefined) return null

    if (score >= SOCIAL_TRUST_THRESHOLDS.VERY_HIGH) return "VERY_HIGH"
    if (score >= SOCIAL_TRUST_THRESHOLDS.HIGH) return "HIGH"
    if (score >= SOCIAL_TRUST_THRESHOLDS.NEUTRAL) return "NEUTRAL"
    if (score >= SOCIAL_TRUST_THRESHOLDS.LOW) return "LOW"
    return "VERY_LOW"
}

/**
 * Normalize Neynar user quality to spamRisk Tier.
 * Note: This is INVERSE of quality - high quality = low spam risk.
 * 
 * @param user - Neynar user data (may be null)
 * @returns spamRisk Tier, or null if data is unavailable
 * 
 * @example
 * normalizeNeynarSpamRisk({ farcaster_user_score: 0.85 })
 * // Returns "VERY_LOW" (high quality = low spam)
 */
export function normalizeNeynarSpamRisk(user: NeynarUser | any | null): Tier | null {
    if (!user) return null

    let score: number | undefined

    // SDK format
    if (user.data && typeof user.data.userScore === 'number') {
        score = user.data.userScore
    } 
    // Legacy format
    else if (user.farcaster_user_score !== undefined) {
        score = user.farcaster_user_score
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
 * Check if a Neynar user is available for normalization.
 */
export function isNeynarAvailable(user: NeynarUser | any | null): boolean {
    if (!user) return false
    
    // SDK format
    if (user.data && typeof user.data.userScore === 'number') return true
    
    // Legacy format
    return user.farcaster_user_score !== undefined
}
