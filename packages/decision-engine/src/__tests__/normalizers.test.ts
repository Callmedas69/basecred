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
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 90 })).toBe("VERY_HIGH")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 70 })).toBe("HIGH")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 50 })).toBe("NEUTRAL")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 30 })).toBe("LOW")
        expect(normalizeEthosTrust({ availability: "available", credibility_score: 10 })).toBe("VERY_LOW")
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
    it("should return NONE for null profile", () => {
        expect(normalizeTalentBuilder(null)).toBe("NONE")
    })

    it("should return NONE for unavailable builder", () => {
        expect(normalizeTalentBuilder({
            builder: { availability: "not_found" },
            creator: { availability: "available" }
        })).toBe("NONE")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 90 },
            creator: { availability: "available" }
        })).toBe("EXPERT")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 60 },
            creator: { availability: "available" }
        })).toBe("ADVANCED")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 30 },
            creator: { availability: "available" }
        })).toBe("INTERMEDIATE")

        expect(normalizeTalentBuilder({
            builder: { availability: "available", score: 10 },
            creator: { availability: "available" }
        })).toBe("NONE")
    })
})

describe("normalizeTalentCreator", () => {
    it("should return NONE for null profile", () => {
        expect(normalizeTalentCreator(null)).toBe("NONE")
    })

    it("should map scores to correct capabilities", () => {
        expect(normalizeTalentCreator({
            builder: { availability: "available" },
            creator: { availability: "available", score: 85 }
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
            ethos: { availability: "available", credibility_score: 50 },
            neynar: { farcaster_user_score: 0.5 },
            talent: {
                builder: { availability: "available", score: 50 },
                creator: { availability: "available", score: 50 }
            }
        })
        expect(coverage).toBe(1)
    })

    it("should return partial coverage for partial data", () => {
        const coverage = calculateSignalCoverage({
            ethos: { availability: "available", credibility_score: 50 },
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
            ethos: { availability: "available", credibility_score: 75 },
            neynar: { farcaster_user_score: 0.8 },
            talent: {
                builder: { availability: "available", score: 60 },
                creator: { availability: "available", score: 40 }
            }
        })

        expect(signals.trust).toBe("HIGH")
        expect(signals.socialTrust).toBe("HIGH")
        expect(signals.builder).toBe("ADVANCED")
        expect(signals.creator).toBe("INTERMEDIATE")
        expect(signals.spamRisk).toBe("VERY_LOW")
        expect(signals.signalCoverage).toBe(1)
    })

    it("should use defaults when providers are unavailable", () => {
        const signals = normalizeSignals({
            ethos: null,
            neynar: null,
            talent: null
        })

        expect(signals.trust).toBe("NEUTRAL")
        expect(signals.socialTrust).toBe("NEUTRAL")
        expect(signals.builder).toBe("NONE")
        expect(signals.creator).toBe("NONE")
        expect(signals.signalCoverage).toBe(0)
    })
})
