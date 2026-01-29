/**
 * Talent Protocol Signal Normalizer
 * 
 * Maps Talent Protocol builder/creator scores to Capability levels.
 * Talent is the source of truth for skills and abilities.
 */

import type { Capability } from "../../types/tiers"

// ============================================================================
// Talent Response Types
// ============================================================================

export type TalentAvailability = "available" | "not_found" | "unlinked" | "error"

export interface TalentFacet {
    availability: TalentAvailability
    score?: number
    level?: string
    last_updated_at?: string
}

export interface TalentProfile {
    builder: TalentFacet
    creator: TalentFacet
}

// ============================================================================
// Normalization Thresholds
// ============================================================================

/**
 * Threshold configuration for Talent → Capability mapping.
 * These values can be tuned based on score distributions.
 */
const TALENT_THRESHOLDS = {
    EXPERT: 80,
    ADVANCED: 50,
    INTERMEDIATE: 20,
    // Below INTERMEDIATE → NONE
} as const

// ============================================================================
// Normalizer Functions
// ============================================================================

/**
 * Normalize Talent builder score to Capability level.
 * 
 * @param profile - Talent profile data (may be null)
 * @returns Builder Capability, or "NONE" if unavailable
 * 
 * @example
 * normalizeTalentBuilder({ builder: { availability: "available", score: 75 } })
 * // Returns "ADVANCED"
 */
export function normalizeTalentBuilder(profile: TalentProfile | null): Capability {
    if (!profile) return "NONE"
    if (profile.builder.availability !== "available") return "NONE"
    if (profile.builder.score === undefined) return "NONE"

    const score = profile.builder.score

    if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT"
    if (score >= TALENT_THRESHOLDS.ADVANCED) return "ADVANCED"
    if (score >= TALENT_THRESHOLDS.INTERMEDIATE) return "INTERMEDIATE"
    return "NONE"
}

/**
 * Normalize Talent creator score to Capability level.
 * 
 * @param profile - Talent profile data (may be null)
 * @returns Creator Capability, or "NONE" if unavailable
 * 
 * @example
 * normalizeTalentCreator({ creator: { availability: "available", score: 90 } })
 * // Returns "EXPERT"
 */
export function normalizeTalentCreator(profile: TalentProfile | null): Capability {
    if (!profile) return "NONE"
    if (profile.creator.availability !== "available") return "NONE"
    if (profile.creator.score === undefined) return "NONE"

    const score = profile.creator.score

    if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT"
    if (score >= TALENT_THRESHOLDS.ADVANCED) return "ADVANCED"
    if (score >= TALENT_THRESHOLDS.INTERMEDIATE) return "INTERMEDIATE"
    return "NONE"
}

/**
 * Check if Talent builder data is available.
 */
export function isTalentBuilderAvailable(profile: TalentProfile | null): boolean {
    return profile !== null && profile.builder.availability === "available"
}

/**
 * Check if Talent creator data is available.
 */
export function isTalentCreatorAvailable(profile: TalentProfile | null): boolean {
    return profile !== null && profile.creator.availability === "available"
}
