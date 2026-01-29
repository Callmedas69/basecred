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
export function normalizeTalentBuilder(profile: TalentProfile | any | null): Capability {
    if (!profile) return "NONE"

    let score: number | undefined

    // SDK format
    if (profile.data && typeof profile.data.builderScore === 'number') {
        score = profile.data.builderScore
    } 
    // Legacy format
    else if (profile.builder && profile.builder.availability === "available" && typeof profile.builder.score === 'number') {
        score = profile.builder.score
    }

    if (score === undefined) return "NONE"

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
export function normalizeTalentCreator(profile: TalentProfile | any | null): Capability {
    if (!profile) return "NONE"

    let score: number | undefined

    // SDK format
    if (profile.data && typeof profile.data.creatorScore === 'number') {
        score = profile.data.creatorScore
    } 
    // Legacy format
    else if (profile.creator && profile.creator.availability === "available" && typeof profile.creator.score === 'number') {
        score = profile.creator.score
    }

    if (score === undefined) return "NONE"

    if (score >= TALENT_THRESHOLDS.EXPERT) return "EXPERT"
    if (score >= TALENT_THRESHOLDS.ADVANCED) return "ADVANCED"
    if (score >= TALENT_THRESHOLDS.INTERMEDIATE) return "INTERMEDIATE"
    return "NONE"
}

/**
 * Check if Talent builder data is available.
 */
export function isTalentBuilderAvailable(profile: TalentProfile | any | null): boolean {
    if (!profile) return false
    
    // SDK format
    if (profile.data && typeof profile.data.builderScore === 'number') return true
    
    // Legacy format
    return profile.builder && profile.builder.availability === "available"
}

/**
 * Check if Talent creator data is available.
 */
export function isTalentCreatorAvailable(profile: TalentProfile | any | null): boolean {
    if (!profile) return false
    
    // SDK format
    if (profile.data && typeof profile.data.creatorScore === 'number') return true

    // Legacy format
    return profile.creator && profile.creator.availability === "available"
}
