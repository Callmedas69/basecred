/**
 * Signal Normalizer Orchestrator
 * 
 * Combines all individual normalizers into a unified NormalizedSignals object.
 * Calculates signal coverage based on available data.
 */

import type { NormalizedSignals } from "../../types/signals"
import type { EthosProfile } from "./ethos"
import type { FarcasterProfile } from "./neynar"
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
    identity?: {
        address?: string
    }
    availability?: {
        ethos?: "available" | "not_found" | "unlinked" | "error"
        talent?: "available" | "not_found" | "unlinked" | "error"
        farcaster?: "available" | "not_found" | "unlinked" | "error"
    }
    ethos?: EthosProfile | null
    talent?: TalentProfile | null
    farcaster?: FarcasterProfile | null
    recency?: {
        lastUpdatedDaysAgo?: number | null
    }
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
 *   ethos: { data: { score: 75 } },
 *   farcaster: { data: { userScore: 0.8 } },
 *   talent: { data: { builderScore: 60 } }
 * })
 */
export function normalizeSignals(profile: UnifiedProfileData): NormalizedSignals {
    // Calculate signal coverage
    const coverage = calculateSignalCoverage(profile)

    // Normalize each signal with fallbacks
    const trust = normalizeEthosTrust(profile.ethos) ?? "NEUTRAL"
    const socialTrust = normalizeNeynarSocialTrust(profile.farcaster) ?? "NEUTRAL"
    const spamRisk = normalizeNeynarSpamRisk(profile.farcaster) ?? "NEUTRAL"
    const builder = normalizeTalentBuilder(profile.talent ?? null)
    const creator = normalizeTalentCreator(profile.talent ?? null)

    // Calculate recency (SDK schema)
    const recencyDays = calculateRecencyDays(profile)

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
        farcaster: 0.3,
        talentBuilder: 0.2,
        talentCreator: 0.2,
    }

    let coverage = 0

    if (isEthosAvailable(profile.ethos)) {
        coverage += weights.ethos
    }

    if (isNeynarAvailable(profile.farcaster ?? null)) {
        coverage += weights.farcaster
    }

    if (isTalentBuilderAvailable(profile.talent ?? null)) {
        coverage += weights.talentBuilder
    }

    if (isTalentCreatorAvailable(profile.talent ?? null)) {
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
 * @param profile - SDK-shaped unified profile
 * @returns Number of days (0 if missing or invalid)
 */
export function calculateRecencyDays(profile: UnifiedProfileData): number {
    const daysAgo = profile.recency?.lastUpdatedDaysAgo
    if (typeof daysAgo === "number") {
        return daysAgo < 0 ? 0 : Math.floor(daysAgo)
    }

    return 0
}

// ============================================================================
// Re-exports
// ============================================================================

export { normalizeEthosTrust, isEthosAvailable } from "./ethos"
export type { EthosProfile } from "./ethos"

export {
    normalizeNeynarSocialTrust,
    normalizeNeynarSpamRisk,
    isNeynarAvailable,
} from "./neynar"
export type { FarcasterProfile } from "./neynar"

export {
    normalizeTalentBuilder,
    normalizeTalentCreator,
    isTalentBuilderAvailable,
    isTalentCreatorAvailable,
} from "./talent"
export type { TalentProfile } from "./talent"
