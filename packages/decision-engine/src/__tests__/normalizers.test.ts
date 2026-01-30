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
        expect(normalizeEthosTrust({ availability: "not_found" })).toBeNull()
    })

    it("should map scores to correct tiers", () => {
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 2300 })).toBe("VERY_HIGH")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 1700 })).toBe("HIGH")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 1300 })).toBe("NEUTRAL")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 900 })).toBe("LOW")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 100 })).toBe("VERY_LOW")
    })
})

describe("normalizeNeynarSocialTrust", () => {
    it("should return null for null user", () => {
        expect(normalizeNeynarSocialTrust(null)).toBeNull()
    })

    it("should map scores to correct tiers", () => {
        expect(normalizeNeynarSocialTrust({ farcaster_user_score: 0.95 })).toBe("VERY_HIGH")
        expect(normalizeNeynarSocialTrust({ farcaster_user_score: 0.8 })).toBe("HIGH")
        expect(normalizeNeynarSocialTrust({ farcaster_user_score: 0.5 })).toBe("NEUTRAL")
        expect(normalizeNeynarSocialTrust({ farcaster_user_score: 0.25 })).toBe("LOW")
        expect(normalizeNeynarSocialTrust({ farcaster_user_score: 0.1 })).toBe("VERY_LOW")
    })
})

describe("normalizeNeynarSpamRisk", () => {
    it("should return inverse of quality score", () => {
        // High quality = low spam risk
        expect(normalizeNeynarSpamRisk({ farcaster_user_score: 0.9 })).toBe("VERY_LOW")
        expect(normalizeNeynarSpamRisk({ farcaster_user_score: 0.1 })).toBe("VERY_HIGH")
    })
})

describe("normalizeTalentBuilder", () => {
    it("should return EXPLORER for null profile", () => {
        expect(normalizeTalentBuilder(null)).toBe("EXPLORER")
    })

    it("should return EXPLORER for unavailable builder", () => {
        expect(normalizeTalentBuilder({
            builder: { availability: "not_found" },
            creator: { availability: "available" }
        })).toBe("EXPLORER")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 260 },
            creator: { availability: "available" }
        })).toBe("ELITE")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 180 },
            creator: { availability: "available" }
        })).toBe("EXPERT")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 90 },
            creator: { availability: "available" }
        })).toBe("BUILDER")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 10 },
            creator: { availability: "available" }
        })).toBe("EXPLORER")
    })
})

describe("normalizeTalentCreator", () => {
    it("should return EXPLORER for null profile", () => {
        expect(normalizeTalentCreator(null)).toBe("EXPLORER")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentCreator({
            builder: { availability: "available" },
            creator: { availability: "available", score: 180 }
        })).toBe("EXPERT")
    })
})

describe("calculateSignalCoverage", () => {
    it("should return 0 when all providers are null", () => {
        const coverage = calculateSignalCoverage({
            ethos: null,
            neynar: null,
            talent: null
        })
        expect(coverage).toBe(0)
    })

    it("should return 1 when all providers are available", () => {
        const coverage = calculateSignalCoverage({
            ethos: { availability: "available", credibility_score: 1300 },
            neynar: { farcaster_user_score: 0.5 },
            talent: {
                builder: { availability: "available", score: 90 },
                creator: { availability: "available", score: 90 }
            }
        })
        expect(coverage).toBe(1)
    })

    it("should return partial coverage for partial data", () => {
        const coverage = calculateSignalCoverage({
            ethos: { availability: "available", credibility_score: 1300 },
            neynar: null,
            talent: null
        })
        expect(coverage).toBe(0.3) // Ethos is 30%
    })
})

describe("calculateRecencyDays", () => {
    it("should return 0 for null date", () => {
        expect(calculateRecencyDays(null)).toBe(0)
    })

    it("should return 0 for undefined date", () => {
        expect(calculateRecencyDays(undefined)).toBe(0)
    })

    it("should return 0 for future date", () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 10)
        expect(calculateRecencyDays(futureDate)).toBe(0)
    })

    it("should calculate days correctly for past date", () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 5)
        expect(calculateRecencyDays(pastDate)).toBe(5)
    })
})

describe("normalizeSignals", () => {
    it("should produce complete NormalizedSignals object", () => {
        const signals = normalizeSignals({
            ethos: { availability: "available", credibility_score: 1700 }, // HIGH (1600+)
            neynar: { farcaster_user_score: 0.8 }, // HIGH
            talent: {
                builder: { availability: "available", score: 180 }, // EXPERT (170+)
                creator: { availability: "available", score: 90 }  // BUILDER (80+)
            }
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
            neynar: null,
            talent: null
        })

        expect(signals.trust).toBe("NEUTRAL") // fallback
        expect(signals.socialTrust).toBe("NEUTRAL") // fallback
        expect(signals.builder).toBe("EXPLORER") // NEW DEFAULT
        expect(signals.creator).toBe("EXPLORER") // NEW DEFAULT
        expect(signals.signalCoverage).toBe(0)
    })
})
