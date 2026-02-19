/**
 * Progression & Explainability Layer Tests
 */

import { describe, it, expect } from "vitest"
import {
    deriveAccessStatus,
    resolveBlockingFactors,
    deriveBlockingFactorsForContext,
    CONTEXT_REQUIREMENTS,
} from "../engine/progression"
import { isHardDenyRule } from "../engine/rules"
import type { NormalizedSignals } from "../types/signals"

// Helper to create signals with defaults
function createSignals(overrides: Partial<NormalizedSignals> = {}): NormalizedSignals {
    return {
        trust: "NEUTRAL",
        socialTrust: "NEUTRAL",
        builder: "EXPLORER",
        creator: "EXPLORER",
        recencyDays: 0,
        spamRisk: "NEUTRAL",
        signalCoverage: 1.0,
        ...overrides,
    }
}

describe("deriveAccessStatus", () => {
    it("maps ALLOW to eligible", () => {
        expect(deriveAccessStatus("ALLOW")).toBe("eligible")
    })

    it("maps ALLOW_WITH_LIMITS to limited", () => {
        expect(deriveAccessStatus("ALLOW_WITH_LIMITS")).toBe("limited")
    })

    it("maps DENY without hard-deny to not_ready", () => {
        expect(deriveAccessStatus("DENY")).toBe("not_ready")
        expect(deriveAccessStatus("DENY", { isHardDeny: false })).toBe("not_ready")
    })

    it("maps DENY with hard-deny to blocked", () => {
        expect(deriveAccessStatus("DENY", { isHardDeny: true })).toBe("blocked")
    })
})

describe("resolveBlockingFactors", () => {
    it("returns all factors as ready for neutral/high signals", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "NEUTRAL",
                socialTrust: "NEUTRAL",
                builder: "BUILDER",
                creator: "BUILDER",
                spamRisk: "LOW",
                signalCoverage: 0.9,
            })
        )

        expect(snapshot.trust).toBe(true)
        expect(snapshot.socialTrust).toBe(true)
        expect(snapshot.builder).toBe(true)
        expect(snapshot.creator).toBe(true)
        expect(snapshot.spamRisk).toBe(true)
        expect(snapshot.signalCoverage).toBe(true)
    })

    it("flags very low trust and spam risk as blocking", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "VERY_LOW",
                socialTrust: "VERY_LOW",
                builder: "EXPLORER",
                creator: "EXPLORER",
                spamRisk: "VERY_HIGH",
                signalCoverage: 0.2,
            })
        )

        expect(snapshot.trust).toBe(false)
        expect(snapshot.socialTrust).toBe(false)
        expect(snapshot.builder).toBe(false)
        expect(snapshot.creator).toBe(false)
        expect(snapshot.spamRisk).toBe(false)
        expect(snapshot.signalCoverage).toBe(false)
    })
})

describe("CONTEXT_REQUIREMENTS", () => {
    it("defines required factors for known contexts", () => {
        expect(CONTEXT_REQUIREMENTS["allowlist.general"]).toEqual(["trust", "socialTrust", "builder", "creator", "spamRisk"])
        expect(CONTEXT_REQUIREMENTS.comment).toEqual(["trust", "socialTrust", "spamRisk"])
        expect(CONTEXT_REQUIREMENTS.publish).toEqual(["trust", "socialTrust", "creator", "spamRisk"])
        expect(CONTEXT_REQUIREMENTS.apply).toEqual(["trust", "socialTrust", "builder", "creator", "spamRisk"])
        expect(CONTEXT_REQUIREMENTS["governance.vote"]).toEqual(["trust", "socialTrust", "spamRisk"])
    })
})

describe("deriveBlockingFactorsForContext", () => {
    it("returns only required factors that are not ready", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "VERY_LOW",
                builder: "EXPLORER",
                creator: "EXPLORER",
                socialTrust: "NEUTRAL",
                spamRisk: "NEUTRAL",
                signalCoverage: 0.9,
            })
        )

        const factors = deriveBlockingFactorsForContext("allowlist.general", snapshot)
        expect(factors).toContain("trust")
        expect(factors).toContain("builder")
        expect(factors).toContain("creator")
        expect(factors).toHaveLength(3)
    })

    it("reports builder and creator as blocking for apply context", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "NEUTRAL",
                builder: "EXPLORER",
                creator: "EXPLORER",
                socialTrust: "NEUTRAL",
                spamRisk: "NEUTRAL",
                signalCoverage: 0.9,
            })
        )

        const factors = deriveBlockingFactorsForContext("apply", snapshot)
        expect(factors).toContain("builder")
        expect(factors).toContain("creator")
        expect(factors).not.toContain("trust")
        expect(factors).toHaveLength(2)
    })

    it("reflects spam and social trust for comment context", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "HIGH",
                socialTrust: "VERY_LOW",
                spamRisk: "VERY_HIGH",
            })
        )

        const factors = deriveBlockingFactorsForContext("comment", snapshot)
        expect(factors).toContain("spamRisk")
        expect(factors).toContain("socialTrust")
        expect(factors).toHaveLength(2)
    })

    it("reports builder and creator as blocking for apply when at BUILDER tier", () => {
        const signals = createSignals({
            trust: "NEUTRAL",
            builder: "BUILDER",
            creator: "BUILDER",
            socialTrust: "NEUTRAL",
            spamRisk: "NEUTRAL",
            signalCoverage: 0.9,
        })
        const snapshot = resolveBlockingFactors(signals)

        // Global snapshot says "ready" (BUILDER !== EXPLORER)
        expect(snapshot.builder).toBe(true)
        expect(snapshot.creator).toBe(true)

        // Context-specific threshold catches the gap
        const factors = deriveBlockingFactorsForContext("apply", snapshot, signals)
        expect(factors).toContain("builder")
        expect(factors).toContain("creator")
        expect(factors).not.toContain("trust")
        expect(factors).toHaveLength(2)
    })

    it("returns empty blockingFactors for apply when builder and creator are EXPERT", () => {
        const signals = createSignals({
            trust: "NEUTRAL",
            builder: "EXPERT",
            creator: "EXPERT",
            socialTrust: "NEUTRAL",
            spamRisk: "NEUTRAL",
            signalCoverage: 0.9,
        })
        const snapshot = resolveBlockingFactors(signals)

        const factors = deriveBlockingFactorsForContext("apply", snapshot, signals)
        expect(factors).toHaveLength(0)
    })

    it("reports trust as blocking for governance.vote at NEUTRAL tier", () => {
        const signals = createSignals({
            trust: "NEUTRAL",
            socialTrust: "NEUTRAL",
            spamRisk: "NEUTRAL",
            signalCoverage: 0.9,
        })
        const snapshot = resolveBlockingFactors(signals)

        // Global snapshot says trust is ready (NEUTRAL !== VERY_LOW)
        expect(snapshot.trust).toBe(true)

        // governance.vote needs trust >= HIGH
        const factors = deriveBlockingFactorsForContext("governance.vote", snapshot, signals)
        expect(factors).toContain("trust")
    })

    it("reports trust and socialTrust as blocking for publish at LOW tier", () => {
        const signals = createSignals({
            trust: "LOW",
            socialTrust: "LOW",
            creator: "BUILDER",
            spamRisk: "NEUTRAL",
            signalCoverage: 0.9,
        })
        const snapshot = resolveBlockingFactors(signals)

        const factors = deriveBlockingFactorsForContext("publish", snapshot, signals)
        expect(factors).toContain("trust")
        expect(factors).toContain("socialTrust")
    })

    it("falls back to global snapshot when signals not provided", () => {
        const snapshot = resolveBlockingFactors(
            createSignals({
                trust: "NEUTRAL",
                builder: "BUILDER",
                creator: "BUILDER",
                socialTrust: "NEUTRAL",
                spamRisk: "NEUTRAL",
            })
        )

        // Without signals, uses global threshold (BUILDER !== EXPLORER = ready)
        const factors = deriveBlockingFactorsForContext("apply", snapshot)
        expect(factors).toHaveLength(0)
    })
})

describe("isHardDenyRule", () => {
    it("returns true for known hard-deny rule IDs", () => {
        expect(isHardDenyRule("deny_spam")).toBe(true)
        expect(isHardDenyRule("deny_low_social_trust")).toBe(true)
        expect(isHardDenyRule("deny_critical_trust")).toBe(true)
    })

    it("returns false for non hard-deny rules", () => {
        expect(isHardDenyRule("allow_high_trust")).toBe(false)
        expect(isHardDenyRule("probation_new_user")).toBe(false)
        expect(isHardDenyRule("unknown_rule")).toBe(false)
    })
}
)

