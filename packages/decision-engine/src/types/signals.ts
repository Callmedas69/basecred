/**
 * Normalized Signals Interface
 * 
 * These signals exist ONLY at decision time and are NOT persisted.
 * They are derived on-demand from external reputation providers.
 */

import type { Tier, Capability } from "./tiers"

/**
 * Normalized signals consumed by the Decision Engine rules.
 * All signals are derived from external providers:
 * - trust: Ethos credibility
 * - socialTrust: Neynar user quality
 * - builder: Talent Protocol builder score
 * - creator: Talent Protocol creator score
 * - spamRisk: Neynar spam detection
 */
export interface NormalizedSignals {
    /** Aggregated long-term trust (derived from Ethos) */
    trust: Tier

    /** Social legitimacy / spam risk (derived from Neynar) */
    socialTrust: Tier

    /** Technical credibility (derived from Talent Protocol) */
    builder: Capability

    /** Content / community credibility (derived from Talent Protocol) */
    creator: Capability

    /** Days since last activity */
    recencyDays: number

    /** Derived spam risk indicator (from Neynar) */
    spamRisk: Tier

    /** 
     * Percentage of signals successfully fetched (0-1)
     * Used by fallback rules to handle partial data
     */
    signalCoverage: number
}

/**
 * Partial signals for when some providers are unavailable
 */
export type PartialSignals = Partial<NormalizedSignals> & {
    signalCoverage: number
}

/**
 * Default signals used when no data is available
 */
export const DEFAULT_SIGNALS: NormalizedSignals = {
    trust: "NEUTRAL",
    socialTrust: "NEUTRAL",
    builder: "EXPLORER",
    creator: "EXPLORER",
    recencyDays: 0,
    spamRisk: "NEUTRAL",
    signalCoverage: 0,
}
