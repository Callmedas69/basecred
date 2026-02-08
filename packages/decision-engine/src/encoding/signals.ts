/**
 * Signal Encoding Utilities
 *
 * Converts NormalizedSignals to circuit-compatible numeric values.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

import type { Tier, Capability } from "../types/tiers"
import type { NormalizedSignals } from "../types/signals"
import { TIER_ORDER, CAPABILITY_ORDER } from "../types/tiers"

/**
 * Circuit-compatible signal representation.
 * All values are numeric for ZK circuit consumption.
 */
export interface CircuitSignals {
    /** Tier encoded as 0-4 */
    trust: number
    /** Tier encoded as 0-4 */
    socialTrust: number
    /** Capability encoded as 0-3 */
    builder: number
    /** Capability encoded as 0-3 */
    creator: number
    /** Days since last activity (uint) */
    recencyDays: number
    /** Tier encoded as 0-4 */
    spamRisk: number
    /** Signal coverage in basis points (0-10000) */
    signalCoverageBps: number
}

/**
 * Encode a Tier to its numeric value for circuit use.
 * Uses the existing TIER_ORDER mapping.
 *
 * @param tier The tier string
 * @returns The numeric tier value (0-4)
 */
export function encodeTier(tier: Tier): number {
    return TIER_ORDER[tier]
}

/**
 * Decode a numeric value back to Tier.
 *
 * @param value The numeric tier value (0-4)
 * @returns The Tier string
 * @throws Error if value is not valid
 */
export function decodeTier(value: number): Tier {
    const entries = Object.entries(TIER_ORDER) as [Tier, number][]
    const entry = entries.find(([, v]) => v === value)
    if (!entry) {
        throw new Error(`Unknown tier value: ${value}`)
    }
    return entry[0]
}

/**
 * Encode a Capability to its numeric value for circuit use.
 * Uses the existing CAPABILITY_ORDER mapping.
 *
 * @param capability The capability string
 * @returns The numeric capability value (0-3)
 */
export function encodeCapability(capability: Capability): number {
    return CAPABILITY_ORDER[capability]
}

/**
 * Decode a numeric value back to Capability.
 *
 * @param value The numeric capability value (0-3)
 * @returns The Capability string
 * @throws Error if value is not valid
 */
export function decodeCapability(value: number): Capability {
    const entries = Object.entries(CAPABILITY_ORDER) as [Capability, number][]
    const entry = entries.find(([, v]) => v === value)
    if (!entry) {
        throw new Error(`Unknown capability value: ${value}`)
    }
    return entry[0]
}

/**
 * Convert signal coverage (0-1 decimal) to basis points (0-10000).
 *
 * @param coverage Signal coverage as decimal (0-1)
 * @returns Signal coverage in basis points (0-10000)
 */
export function signalCoverageToBps(coverage: number): number {
    if (coverage < 0 || coverage > 1) {
        throw new Error(`Signal coverage must be between 0 and 1, got: ${coverage}`)
    }
    return Math.round(coverage * 10000)
}

/**
 * Convert basis points (0-10000) back to decimal coverage (0-1).
 *
 * @param bps Signal coverage in basis points (0-10000)
 * @returns Signal coverage as decimal (0-1)
 */
export function bpsToSignalCoverage(bps: number): number {
    if (bps < 0 || bps > 10000) {
        throw new Error(`Basis points must be between 0 and 10000, got: ${bps}`)
    }
    return bps / 10000
}

/**
 * Encode all NormalizedSignals to circuit-compatible format.
 *
 * @param signals The normalized signals from the decision engine
 * @returns Circuit-compatible signal values
 */
export function encodeSignalsForCircuit(signals: NormalizedSignals): CircuitSignals {
    return {
        trust: encodeTier(signals.trust),
        socialTrust: encodeTier(signals.socialTrust),
        builder: encodeCapability(signals.builder),
        creator: encodeCapability(signals.creator),
        recencyDays: signals.recencyDays,
        spamRisk: encodeTier(signals.spamRisk),
        signalCoverageBps: signalCoverageToBps(signals.signalCoverage),
    }
}
