/**
 * Talent Protocol Signal Normalizer (SDK schema)
 *
 * Maps Talent Protocol builder / creator scores
 * into normalized Capability levels.
 *
 * Talent is treated as the source of truth.
 */

import type { Capability } from "../../types/tiers"

// ============================================================================
// Talent Response Types
// ============================================================================

export interface TalentProfile {
    data?: {
        builderScore?: number
        builderRankPosition?: number | null
        creatorScore?: number
        creatorRankPosition?: number | null
    }
    signals?: {
        verifiedBuilder?: boolean
        verifiedCreator?: boolean
    }
    meta?: {
        lastUpdatedAt?: string | null
        lastUpdatedDaysAgo?: number | null
    }
}

// ============================================================================
// Normalization Thresholds (FIXED & CANONICAL)
// ============================================================================

/**
 * Talent → Capability thresholds
 *
 * Explorer : 0–79
 * Builder  : 80–169
 * Expert   : 170–249
 * Elite    : 250+
 */
const TALENT_THRESHOLDS = {
    BUILDER: 80,
    EXPERT: 170,
    ELITE: 250,
} as const

// ============================================================================
// Internal Helpers
// ============================================================================

function normalizeScoreToCapability(score: number): Capability {
    if (score >= TALENT_THRESHOLDS.ELITE) return "ELITE"
    if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT"
    if (score >= TALENT_THRESHOLDS.BUILDER) return "BUILDER"
    return "EXPLORER"
}

// ============================================================================
// Normalizers
// ============================================================================

/**
 * Normalize Talent builder score to Capability level.
 */
export function normalizeTalentBuilder(
    profile: TalentProfile | any | null
): Capability {
    if (!profile) return "EXPLORER"

    let score: number | undefined

    if (profile.data && typeof profile.data.builderScore === "number") {
        score = profile.data.builderScore
    }

    if (score === undefined) return "EXPLORER"

    return normalizeScoreToCapability(score)
}

/**
 * Normalize Talent creator score to Capability level.
 */
export function normalizeTalentCreator(
    profile: TalentProfile | any | null
): Capability {
    if (!profile) return "EXPLORER"

    let score: number | undefined

    if (profile.data && typeof profile.data.creatorScore === "number") {
        score = profile.data.creatorScore
    }

    if (score === undefined) return "EXPLORER"

    return normalizeScoreToCapability(score)
}

// ============================================================================
// Availability Checks
// ============================================================================

/**
 * Check if Talent builder data is available.
 */
export function isTalentBuilderAvailable(
    profile: TalentProfile | any | null
): boolean {
    if (!profile) return false

    return !!(profile.data && typeof profile.data.builderScore === "number")
}

/**
 * Check if Talent creator data is available.
 */
export function isTalentCreatorAvailable(
    profile: TalentProfile | any | null
): boolean {
    if (!profile) return false

    return !!(profile.data && typeof profile.data.creatorScore === "number")
}
