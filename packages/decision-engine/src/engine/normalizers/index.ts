/**
 * Signal Normalizer Orchestrator
 * 
 * Combines all individual normalizers into a unified NormalizedSignals object.
 * Calculates signal coverage based on available data.
 */

import type { NormalizedSignals } from "../../types/signals"
import type { EthosProfile } from "./ethos"
import type { NeynarUser } from "./neynar"
import type { TalentProfile } from "./talent"

import { normalizeEthosTrust, isEthosAvailable } from "./ethos"
import {
    normalizeNeynarSocialTrust,
    normalizeNeynarSpamRisk,
    isNeynarAvailable,
} from "./neynar"
import {
    normalizeTalentBuilder,
    normalizeTalentCreator,
    isTalentBuilderAvailable,
    isTalentCreatorAvailable,
} from "./talent"

// ============================================================================
// Unified Profile Input
// ============================================================================

/**
 * Combined profile data from all providers.
 */
export interface UnifiedProfileData {
    ethos: EthosProfile | any | null
    neynar: NeynarUser | any | null
    talent: TalentProfile | any | null
    /** Timestamp of last activity (for recency calculation) */
    lastActivityAt?: Date | null
}

// ============================================================================
// Signal Normalization
// ============================================================================

/**
 * Normalize all signals from a unified profile.
 * 
 * @param profile - Combined profile data from all providers
 * @returns NormalizedSignals ready for rule evaluation
 * 
 * @example
 * const signals = normalizeSignals({
 *   ethos: { availability: "available", credibility_score: 75 },
 *   neynar: { farcaster_user_score: 0.8 },
 *   talent: { builder: { availability: "available", score: 60 } }
 * })
 */
export function normalizeSignals(profile: UnifiedProfileData): NormalizedSignals {
    // Calculate signal coverage
    const coverage = calculateSignalCoverage(profile)

    // Normalize each signal with fallbacks
    const trust = normalizeEthosTrust(profile.ethos) ?? "NEUTRAL"
    const socialTrust = normalizeNeynarSocialTrust(profile.neynar) ?? "NEUTRAL"
    const spamRisk = normalizeNeynarSpamRisk(profile.neynar) ?? "NEUTRAL"
    const builder = normalizeTalentBuilder(profile.talent)
    const creator = normalizeTalentCreator(profile.talent)

    // Calculate recency
    const recencyDays = calculateRecencyDays(profile.lastActivityAt)

    return {
        trust,
        socialTrust,
        builder,
        creator,
        recencyDays,
        spamRisk,
        signalCoverage: coverage,
    }
}

// ============================================================================
// Coverage Calculation
// ============================================================================

/**
 * Calculate what percentage of signals are available.
 * Used by fallback rules to handle partial data gracefully.
 * 
 * Weights:
 * - Ethos: 30% (primary trust signal)
 * - Neynar: 30% (social/spam signal)
 * - Talent Builder: 20%
 * - Talent Creator: 20%
 */
export function calculateSignalCoverage(profile: UnifiedProfileData): number {
    const weights = {
        ethos: 0.3,
        neynar: 0.3,
        talentBuilder: 0.2,
        talentCreator: 0.2,
    }

    let coverage = 0

    if (isEthosAvailable(profile.ethos)) {
        coverage += weights.ethos
    }

    if (isNeynarAvailable(profile.neynar)) {
        coverage += weights.neynar
    }

    if (isTalentBuilderAvailable(profile.talent)) {
        coverage += weights.talentBuilder
    }

    if (isTalentCreatorAvailable(profile.talent)) {
        coverage += weights.talentCreator
    }

    return coverage
}

// ============================================================================
// Recency Calculation
// ============================================================================

/**
 * Calculate days since last activity.
 * 
 * @param lastActivityAt - Timestamp of last activity
 * @returns Number of days (0 if future or missing)
 */
export function calculateRecencyDays(lastActivityAt: Date | null | undefined): number {
    if (!lastActivityAt) return 0

    const now = new Date()
    const diffMs = now.getTime() - lastActivityAt.getTime()

    // Future timestamps return 0
    if (diffMs < 0) return 0

    // Convert to days (floor)
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// ============================================================================
// Re-exports
// ============================================================================

export { normalizeEthosTrust, isEthosAvailable } from "./ethos"
export type { EthosProfile, EthosAvailability } from "./ethos"

export {
    normalizeNeynarSocialTrust,
    normalizeNeynarSpamRisk,
    isNeynarAvailable,
} from "./neynar"
export type { NeynarUser } from "./neynar"

export {
    normalizeTalentBuilder,
    normalizeTalentCreator,
    isTalentBuilderAvailable,
    isTalentCreatorAvailable,
} from "./talent"
export type { TalentProfile, TalentFacet, TalentAvailability } from "./talent"
