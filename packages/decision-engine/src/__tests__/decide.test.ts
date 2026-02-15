/**
 * Decision Engine Tests
 */

import { describe, it, expect } from "vitest"
import { decide } from "../engine/decide"
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

describe("decide", () => {
    describe("Fallback Rules", () => {
        it("should DENY when signal coverage is 0", () => {
            const signals = createSignals({ signalCoverage: 0 })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toContain("deny_no_signals")
        })

        it("should ALLOW_WITH_LIMITS when signal coverage is below 50%", () => {
            const signals = createSignals({ signalCoverage: 0.3 })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW_WITH_LIMITS")
            expect(result.ruleIds).toContain("limit_partial_signals")
        })
    })

    describe("Hard Deny Rules", () => {
        it("should DENY when spam risk is HIGH", () => {
            const signals = createSignals({ spamRisk: "HIGH" })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toContain("deny_spam")
        })

        it("should DENY when spam risk is VERY_HIGH", () => {
            const signals = createSignals({ spamRisk: "VERY_HIGH" })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toContain("deny_spam")
        })

        it("should DENY when social trust is VERY_LOW", () => {
            const signals = createSignals({ socialTrust: "VERY_LOW" })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toContain("deny_low_social_trust")
        })

        it("should ALLOW_WITH_LIMITS when social trust is LOW (probation)", () => {
            const signals = createSignals({ socialTrust: "LOW" })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW_WITH_LIMITS")
            expect(result.ruleIds).toContain("probation_low_social")
        })

        it("should DENY when trust is VERY_LOW", () => {
            const signals = createSignals({ trust: "VERY_LOW", socialTrust: "HIGH" })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toContain("deny_critical_trust")
        })
    })

    describe("Allow Rules", () => {
        it("should ALLOW elite builders", () => {
            const signals = createSignals({
                builder: "ELITE",
                socialTrust: "HIGH",
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_strong_builder")
        })

        it("should ALLOW expert builders with high social trust", () => {
            const signals = createSignals({
                builder: "EXPERT",
                socialTrust: "HIGH",
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_strong_builder")
        })

        it("should ALLOW elite creators", () => {
            const signals = createSignals({
                creator: "ELITE",
                socialTrust: "HIGH",
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_strong_creator")
        })

        it("should ALLOW high trust users", () => {
            const signals = createSignals({
                trust: "HIGH",
                socialTrust: "HIGH",
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_high_trust")
        })
    })

    describe("Allow With Limits Rules", () => {
        it("should ALLOW_WITH_LIMITS for inactive users", () => {
            const signals = createSignals({
                trust: "NEUTRAL",
                socialTrust: "NEUTRAL",
                recencyDays: 20,
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW_WITH_LIMITS")
            expect(result.ruleIds).toContain("probation_inactive")
        })

        it("should ALLOW_WITH_LIMITS for new users with no capabilities", () => {
            const signals = createSignals({
                trust: "NEUTRAL",
                socialTrust: "NEUTRAL",
                builder: "EXPLORER",
                creator: "EXPLORER",
                recencyDays: 0,
            })
            const result = decide(signals, "allowlist.general")

            expect(result.decision).toBe("ALLOW_WITH_LIMITS")
            expect(result.ruleIds).toContain("probation_new_user")
        })
    })

    describe("Context-specific Rules", () => {
        it("should ALLOW commenting for neutral trust users", () => {
            const signals = createSignals({
                trust: "NEUTRAL",
                socialTrust: "NEUTRAL",
            })
            const result = decide(signals, "comment")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_comment_trusted")
        })

        it("should ALLOW governance voting for active high-trust users", () => {
            const signals = createSignals({
                trust: "HIGH",
                socialTrust: "NEUTRAL",
                recencyDays: 10,
            })
            const result = decide(signals, "governance.vote")

            expect(result.decision).toBe("ALLOW")
            expect(result.ruleIds).toContain("allow_governance_vote")
        })
    })

    describe("Default Deny", () => {
        it("should DENY when no rule matches for unknown context", () => {
            const signals = createSignals({
                trust: "NEUTRAL",
                socialTrust: "NEUTRAL",
            })
            const result = decide(signals, "unknown.context")

            expect(result.decision).toBe("DENY")
            expect(result.ruleIds).toHaveLength(0)
            expect(result.explain).toContain("No rule satisfied for this context")
        })
    })

    describe("Decision Output Format", () => {
        it("should include all required fields", () => {
            const signals = createSignals({ builder: "EXPERT" })
            const result = decide(signals, "allowlist.general")

            expect(result).toHaveProperty("decision")
            expect(result).toHaveProperty("confidence")
            expect(result).toHaveProperty("constraints")
            expect(result).toHaveProperty("retryAfter")
            expect(result).toHaveProperty("ruleIds")
            expect(result).toHaveProperty("version")
            expect(result).toHaveProperty("explain")
        })

        it("should include version v1", () => {
            const signals = createSignals({ builder: "EXPERT" })
            const result = decide(signals, "allowlist.general")

            expect(result.version).toBe("v1")
        })
    })
})
