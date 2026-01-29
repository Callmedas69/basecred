/**
 * Tier Comparison Tests
 */

import { describe, it, expect } from "vitest"
import {
    tierGte,
    tierLt,
    tierGt,
    tierLte,
    capabilityGte,
    capabilityLt,
    TIER_ORDER,
    CAPABILITY_ORDER,
} from "../types/tiers"

describe("Tier Order", () => {
    it("should have correct ordering values", () => {
        expect(TIER_ORDER.VERY_LOW).toBe(0)
        expect(TIER_ORDER.LOW).toBe(1)
        expect(TIER_ORDER.NEUTRAL).toBe(2)
        expect(TIER_ORDER.HIGH).toBe(3)
        expect(TIER_ORDER.VERY_HIGH).toBe(4)
    })
})

describe("tierGte", () => {
    it("should return true when first tier is greater", () => {
        expect(tierGte("HIGH", "NEUTRAL")).toBe(true)
        expect(tierGte("VERY_HIGH", "LOW")).toBe(true)
    })

    it("should return true when tiers are equal", () => {
        expect(tierGte("HIGH", "HIGH")).toBe(true)
        expect(tierGte("NEUTRAL", "NEUTRAL")).toBe(true)
    })

    it("should return false when first tier is lower", () => {
        expect(tierGte("LOW", "HIGH")).toBe(false)
        expect(tierGte("NEUTRAL", "VERY_HIGH")).toBe(false)
    })
})

describe("tierLt", () => {
    it("should return true when first tier is lower", () => {
        expect(tierLt("LOW", "HIGH")).toBe(true)
        expect(tierLt("VERY_LOW", "NEUTRAL")).toBe(true)
    })

    it("should return false when tiers are equal", () => {
        expect(tierLt("HIGH", "HIGH")).toBe(false)
    })

    it("should return false when first tier is higher", () => {
        expect(tierLt("HIGH", "LOW")).toBe(false)
    })
})

describe("tierGt", () => {
    it("should return true when first tier is strictly greater", () => {
        expect(tierGt("HIGH", "NEUTRAL")).toBe(true)
    })

    it("should return false when tiers are equal", () => {
        expect(tierGt("HIGH", "HIGH")).toBe(false)
    })
})

describe("tierLte", () => {
    it("should return true when first tier is lower or equal", () => {
        expect(tierLte("LOW", "HIGH")).toBe(true)
        expect(tierLte("HIGH", "HIGH")).toBe(true)
    })

    it("should return false when first tier is higher", () => {
        expect(tierLte("HIGH", "LOW")).toBe(false)
    })
})

describe("Capability Order", () => {
    it("should have correct ordering values", () => {
        expect(CAPABILITY_ORDER.NONE).toBe(0)
        expect(CAPABILITY_ORDER.INTERMEDIATE).toBe(1)
        expect(CAPABILITY_ORDER.ADVANCED).toBe(2)
        expect(CAPABILITY_ORDER.EXPERT).toBe(3)
    })
})

describe("capabilityGte", () => {
    it("should return true when first capability is greater or equal", () => {
        expect(capabilityGte("EXPERT", "ADVANCED")).toBe(true)
        expect(capabilityGte("ADVANCED", "ADVANCED")).toBe(true)
    })

    it("should return false when first capability is lower", () => {
        expect(capabilityGte("NONE", "INTERMEDIATE")).toBe(false)
    })
})

describe("capabilityLt", () => {
    it("should return true when first capability is lower", () => {
        expect(capabilityLt("NONE", "EXPERT")).toBe(true)
    })

    it("should return false when first capability is higher or equal", () => {
        expect(capabilityLt("EXPERT", "NONE")).toBe(false)
        expect(capabilityLt("ADVANCED", "ADVANCED")).toBe(false)
    })
})
