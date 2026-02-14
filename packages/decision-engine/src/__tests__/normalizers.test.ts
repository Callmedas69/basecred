/**
 * Signal Normalizer Tests
 */

import { describe, it, expect } from "vitest"
import {
    normalizeSignals,
    calculateSignalCoverage,
    calculateRecencyDays,
    normalizeEthosTrust,
    normalizeNeynarSocialTrust,
    normalizeNeynarSpamRisk,
    normalizeTalentBuilder,
    normalizeTalentCreator,
} from "../engine/normalizers"

describe("normalizeEthosTrust", () => {
    it("should return null for null profile", () => {
        expect(normalizeEthosTrust(null)).toBeNull()
    })

    it("should return null for unavailable profile", () => {
        expect(normalizeEthosTrust({})).toBeNull()
    })

    it("should map scores to correct tiers", () => {
        expect(normalizeEthosTrust({ data: { score: 2300 } })).toBe("VERY_HIGH")
        expect(normalizeEthosTrust({ data: { score: 1700 } })).toBe("HIGH")
        expect(normalizeEthosTrust({ data: { score: 1000 } })).toBe("NEUTRAL")
        expect(normalizeEthosTrust({ data: { score: 700 } })).toBe("LOW")
        expect(normalizeEthosTrust({ data: { score: 100 } })).toBe("VERY_LOW")
    })
})

describe("normalizeNeynarSocialTrust", () => {
    it("should return null for null user", () => {
        expect(normalizeNeynarSocialTrust(null)).toBeNull()
    })

    it("should map scores to correct tiers", () => {
        expect(normalizeNeynarSocialTrust({ data: { userScore: 0.95 } })).toBe("VERY_HIGH")
        expect(normalizeNeynarSocialTrust({ data: { userScore: 0.8 } })).toBe("HIGH")
        expect(normalizeNeynarSocialTrust({ data: { userScore: 0.5 } })).toBe("NEUTRAL")
        expect(normalizeNeynarSocialTrust({ data: { userScore: 0.25 } })).toBe("LOW")
        expect(normalizeNeynarSocialTrust({ data: { userScore: 0.1 } })).toBe("VERY_LOW")
    })
})

describe("normalizeNeynarSpamRisk", () => {
    it("should return inverse of quality score", () => {
        // High quality = low spam risk
        expect(normalizeNeynarSpamRisk({ data: { userScore: 0.9 } })).toBe("VERY_LOW")
        expect(normalizeNeynarSpamRisk({ data: { userScore: 0.1 } })).toBe("VERY_HIGH")
    })
})

describe("normalizeTalentBuilder", () => {
    it("should return EXPLORER for null profile", () => {
        expect(normalizeTalentBuilder(null)).toBe("EXPLORER")
    })

    it("should return EXPLORER for unavailable builder", () => {
        expect(normalizeTalentBuilder({
            data: { creatorScore: 120 }
        })).toBe("EXPLORER")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentBuilder({
            data: { builderScore: 260, creatorScore: 120 }
        })).toBe("ELITE")

        expect(normalizeTalentBuilder({
            data: { builderScore: 180, creatorScore: 120 }
        })).toBe("EXPERT")

        expect(normalizeTalentBuilder({
            data: { builderScore: 90, creatorScore: 120 }
        })).toBe("BUILDER")

        expect(normalizeTalentBuilder({
            data: { builderScore: 10, creatorScore: 120 }
        })).toBe("EXPLORER")
    })
})

describe("normalizeTalentCreator", () => {
    it("should return EXPLORER for null profile", () => {
        expect(normalizeTalentCreator(null)).toBe("EXPLORER")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentCreator({
            data: { builderScore: 120, creatorScore: 180 }
        })).toBe("EXPERT")
    })
})

describe("calculateSignalCoverage", () => {
    it("should return 0 when all providers are null", () => {
        const coverage = calculateSignalCoverage({
            ethos: null,
            farcaster: null,
            talent: null
        })
        expect(coverage).toBe(0)
    })

    it("should return 1 when all providers are available", () => {
        const coverage = calculateSignalCoverage({
            ethos: { data: { score: 1300 } },
            farcaster: { data: { userScore: 0.5 } },
            talent: { data: { builderScore: 90, creatorScore: 90 } }
        })
        expect(coverage).toBe(1)
    })

    it("should return partial coverage for partial data", () => {
        const coverage = calculateSignalCoverage({
            ethos: { data: { score: 1300 } },
            farcaster: null,
            talent: null
        })
        expect(coverage).toBe(0.3) // Ethos is 30%
    })
})

describe("calculateRecencyDays", () => {
    it("should return 0 for null date", () => {
        expect(calculateRecencyDays({ recency: { lastUpdatedDaysAgo: null } })).toBe(0)
    })

    it("should return 0 for undefined date", () => {
        expect(calculateRecencyDays({})).toBe(0)
    })

    it("should return 0 for future date", () => {
        expect(calculateRecencyDays({ recency: { lastUpdatedDaysAgo: -5 } })).toBe(0)
    })

    it("should calculate days correctly for past date", () => {
        expect(calculateRecencyDays({ recency: { lastUpdatedDaysAgo: 5 } })).toBe(5)
    })
})

describe("normalizeSignals", () => {
    it("should produce complete NormalizedSignals object", () => {
        const signals = normalizeSignals({
            ethos: { data: { score: 1700 } }, // HIGH (1600+)
            farcaster: { data: { userScore: 0.8 } }, // HIGH
            talent: { data: { builderScore: 180, creatorScore: 90 } }
        })

        expect(signals.trust).toBe("HIGH")
        expect(signals.socialTrust).toBe("HIGH")
        expect(signals.builder).toBe("EXPERT")
        expect(signals.creator).toBe("BUILDER")
        expect(signals.spamRisk).toBe("VERY_LOW")
        expect(signals.signalCoverage).toBe(1)
    })

    it("should use defaults when providers are unavailable", () => {
        const signals = normalizeSignals({
            ethos: null,
            farcaster: null,
            talent: null
        })

        expect(signals.trust).toBe("NEUTRAL") // fallback
        expect(signals.socialTrust).toBe("NEUTRAL") // fallback
        expect(signals.builder).toBe("EXPLORER") // NEW DEFAULT
        expect(signals.creator).toBe("EXPLORER") // NEW DEFAULT
        expect(signals.signalCoverage).toBe(0)
    })
})
