/**
 * Encoding Module Tests
 *
 * Tests for circuit/contract encoding utilities.
 */

import { describe, it, expect } from "vitest"
import {
    // Context encoding
    encodeContextId,
    decodeContextId,
    contextToBytes32,
    CONTEXT_ID_MAP,
    // Decision encoding
    encodeDecision,
    decodeDecision,
    DECISION_VALUE_MAP,
    // Signal encoding
    encodeTier,
    decodeTier,
    encodeCapability,
    decodeCapability,
    signalCoverageToBps,
    bpsToSignalCoverage,
    encodeSignalsForCircuit,
    // Policy hash encoding
    BN254_FIELD_ORDER,
    stripPolicyHashPrefix,
    policyHashToFieldElement,
    policyHashToBytes32,
    isPolicyHashValidFieldElement,
    // Proof encoding
    snarkjsProofToContract,
    contractProofToStrings,
    stringProofToContract,
    // Subject encoding
    subjectToBytes32,
    isValidBytes32,
} from "../encoding"
import type { NormalizedSignals } from "../types/signals"
import type { DecisionContext } from "../types/decisions"
import type { Decision } from "../types/rules"
import type { Tier, Capability } from "../types/tiers"

// =============================================================================
// Context Encoding Tests
// =============================================================================

describe("Context Encoding", () => {
    describe("encodeContextId", () => {
        it("should encode all valid contexts", () => {
            expect(encodeContextId("allowlist.general")).toBe(0)
            expect(encodeContextId("comment")).toBe(1)
            expect(encodeContextId("publish")).toBe(2)
            expect(encodeContextId("apply")).toBe(3)
            expect(encodeContextId("governance.vote")).toBe(4)
        })

        it("should throw for invalid context", () => {
            expect(() => encodeContextId("invalid" as DecisionContext)).toThrow(
                "Unknown context: invalid"
            )
        })
    })

    describe("decodeContextId", () => {
        it("should decode all valid IDs", () => {
            expect(decodeContextId(0)).toBe("allowlist.general")
            expect(decodeContextId(1)).toBe("comment")
            expect(decodeContextId(2)).toBe("publish")
            expect(decodeContextId(3)).toBe("apply")
            expect(decodeContextId(4)).toBe("governance.vote")
        })

        it("should throw for invalid ID", () => {
            expect(() => decodeContextId(99)).toThrow("Unknown context ID: 99")
        })
    })

    describe("contextToBytes32", () => {
        it("should convert context to padded bytes32", () => {
            const result = contextToBytes32("allowlist.general")
            expect(result).toBe(
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            )

            const result2 = contextToBytes32("governance.vote")
            expect(result2).toBe(
                "0x0000000000000000000000000000000000000000000000000000000000000004"
            )
        })
    })

    describe("round-trip", () => {
        it("should encode and decode correctly", () => {
            const contexts: DecisionContext[] = [
                "allowlist.general",
                "comment",
                "publish",
                "apply",
                "governance.vote",
            ]

            for (const context of contexts) {
                const encoded = encodeContextId(context)
                const decoded = decodeContextId(encoded)
                expect(decoded).toBe(context)
            }
        })
    })
})

// =============================================================================
// Decision Encoding Tests
// =============================================================================

describe("Decision Encoding", () => {
    describe("encodeDecision", () => {
        it("should encode all valid decisions", () => {
            expect(encodeDecision("DENY")).toBe(0)
            expect(encodeDecision("ALLOW_WITH_LIMITS")).toBe(1)
            expect(encodeDecision("ALLOW")).toBe(2)
        })

        it("should throw for invalid decision", () => {
            expect(() => encodeDecision("INVALID" as Decision)).toThrow(
                "Unknown decision: INVALID"
            )
        })
    })

    describe("decodeDecision", () => {
        it("should decode all valid values", () => {
            expect(decodeDecision(0)).toBe("DENY")
            expect(decodeDecision(1)).toBe("ALLOW_WITH_LIMITS")
            expect(decodeDecision(2)).toBe("ALLOW")
        })

        it("should throw for invalid value", () => {
            expect(() => decodeDecision(99)).toThrow("Unknown decision value: 99")
        })
    })

    describe("round-trip", () => {
        it("should encode and decode correctly", () => {
            const decisions: Decision[] = ["DENY", "ALLOW_WITH_LIMITS", "ALLOW"]

            for (const decision of decisions) {
                const encoded = encodeDecision(decision)
                const decoded = decodeDecision(encoded)
                expect(decoded).toBe(decision)
            }
        })
    })
})

// =============================================================================
// Signal Encoding Tests
// =============================================================================

describe("Signal Encoding", () => {
    describe("encodeTier", () => {
        it("should encode all tiers", () => {
            expect(encodeTier("VERY_LOW")).toBe(0)
            expect(encodeTier("LOW")).toBe(1)
            expect(encodeTier("NEUTRAL")).toBe(2)
            expect(encodeTier("HIGH")).toBe(3)
            expect(encodeTier("VERY_HIGH")).toBe(4)
        })
    })

    describe("decodeTier", () => {
        it("should decode all tier values", () => {
            expect(decodeTier(0)).toBe("VERY_LOW")
            expect(decodeTier(1)).toBe("LOW")
            expect(decodeTier(2)).toBe("NEUTRAL")
            expect(decodeTier(3)).toBe("HIGH")
            expect(decodeTier(4)).toBe("VERY_HIGH")
        })

        it("should throw for invalid value", () => {
            expect(() => decodeTier(99)).toThrow("Unknown tier value: 99")
        })
    })

    describe("encodeCapability", () => {
        it("should encode all capabilities", () => {
            expect(encodeCapability("EXPLORER")).toBe(0)
            expect(encodeCapability("BUILDER")).toBe(1)
            expect(encodeCapability("EXPERT")).toBe(2)
            expect(encodeCapability("ELITE")).toBe(3)
        })
    })

    describe("decodeCapability", () => {
        it("should decode all capability values", () => {
            expect(decodeCapability(0)).toBe("EXPLORER")
            expect(decodeCapability(1)).toBe("BUILDER")
            expect(decodeCapability(2)).toBe("EXPERT")
            expect(decodeCapability(3)).toBe("ELITE")
        })

        it("should throw for invalid value", () => {
            expect(() => decodeCapability(99)).toThrow("Unknown capability value: 99")
        })
    })

    describe("signalCoverageToBps", () => {
        it("should convert decimal to basis points", () => {
            expect(signalCoverageToBps(0)).toBe(0)
            expect(signalCoverageToBps(0.5)).toBe(5000)
            expect(signalCoverageToBps(0.75)).toBe(7500)
            expect(signalCoverageToBps(1)).toBe(10000)
        })

        it("should round correctly", () => {
            expect(signalCoverageToBps(0.3333)).toBe(3333)
        })

        it("should throw for out-of-range values", () => {
            expect(() => signalCoverageToBps(-0.1)).toThrow()
            expect(() => signalCoverageToBps(1.1)).toThrow()
        })
    })

    describe("bpsToSignalCoverage", () => {
        it("should convert basis points to decimal", () => {
            expect(bpsToSignalCoverage(0)).toBe(0)
            expect(bpsToSignalCoverage(5000)).toBe(0.5)
            expect(bpsToSignalCoverage(7500)).toBe(0.75)
            expect(bpsToSignalCoverage(10000)).toBe(1)
        })

        it("should throw for out-of-range values", () => {
            expect(() => bpsToSignalCoverage(-1)).toThrow()
            expect(() => bpsToSignalCoverage(10001)).toThrow()
        })
    })

    describe("encodeSignalsForCircuit", () => {
        it("should encode all signal fields", () => {
            const signals: NormalizedSignals = {
                trust: "HIGH",
                socialTrust: "NEUTRAL",
                builder: "EXPERT",
                creator: "BUILDER",
                recencyDays: 30,
                spamRisk: "LOW",
                signalCoverage: 0.8,
            }

            const encoded = encodeSignalsForCircuit(signals)

            expect(encoded.trust).toBe(3) // HIGH
            expect(encoded.socialTrust).toBe(2) // NEUTRAL
            expect(encoded.builder).toBe(2) // EXPERT
            expect(encoded.creator).toBe(1) // BUILDER
            expect(encoded.recencyDays).toBe(30)
            expect(encoded.spamRisk).toBe(1) // LOW
            expect(encoded.signalCoverageBps).toBe(8000)
        })
    })
})

// =============================================================================
// Policy Hash Encoding Tests
// =============================================================================

describe("Policy Hash Encoding", () => {
    describe("stripPolicyHashPrefix", () => {
        it("should strip sha256: prefix", () => {
            expect(stripPolicyHashPrefix("sha256:abc123")).toBe("abc123")
        })

        it("should return unchanged if no prefix", () => {
            expect(stripPolicyHashPrefix("abc123")).toBe("abc123")
        })
    })

    describe("policyHashToFieldElement", () => {
        it("should convert hex hash to bigint", () => {
            const result = policyHashToFieldElement("sha256:0123456789abcdef")
            expect(typeof result).toBe("bigint")
            expect(result).toBe(BigInt("0x0123456789abcdef"))
        })

        it("should reduce mod BN254 field order for large hashes", () => {
            // A full SHA-256 hash (64 hex chars)
            const fullHash =
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            const result = policyHashToFieldElement(fullHash)

            // Result should be less than field order
            expect(result < BN254_FIELD_ORDER).toBe(true)
        })

        it("should throw for invalid hex", () => {
            expect(() => policyHashToFieldElement("sha256:xyz")).toThrow()
        })
    })

    describe("policyHashToBytes32", () => {
        it("should convert to padded bytes32", () => {
            const result = policyHashToBytes32("sha256:ff")
            expect(result).toBe(
                "0x00000000000000000000000000000000000000000000000000000000000000ff"
            )
        })

        it("should be 66 characters (0x + 64 hex)", () => {
            const result = policyHashToBytes32("sha256:abc123")
            expect(result.length).toBe(66)
            expect(result.startsWith("0x")).toBe(true)
        })
    })

    describe("isPolicyHashValidFieldElement", () => {
        it("should return true for small hashes", () => {
            expect(isPolicyHashValidFieldElement("sha256:abc123")).toBe(true)
        })

        it("should return false for invalid hex", () => {
            expect(isPolicyHashValidFieldElement("sha256:xyz")).toBe(false)
        })
    })
})

// =============================================================================
// Proof Encoding Tests
// =============================================================================

describe("Proof Encoding", () => {
    const mockSnarkjsProof = {
        pi_a: ["123", "456", "1"] as [string, string, string],
        pi_b: [
            ["789", "101112"] as [string, string],
            ["131415", "161718"] as [string, string],
            ["1", "1"] as [string, string],
        ] as [[string, string], [string, string], [string, string]],
        pi_c: ["192021", "222324", "1"] as [string, string, string],
        protocol: "groth16",
        curve: "bn128",
    }

    describe("snarkjsProofToContract", () => {
        it("should convert pi_a correctly", () => {
            const result = snarkjsProofToContract(mockSnarkjsProof)
            expect(result.a[0]).toBe(BigInt("123"))
            expect(result.a[1]).toBe(BigInt("456"))
        })

        it("should swap B point coordinates", () => {
            const result = snarkjsProofToContract(mockSnarkjsProof)
            // snarkjs B[0] = [789, 101112] should become [101112, 789]
            expect(result.b[0][0]).toBe(BigInt("101112"))
            expect(result.b[0][1]).toBe(BigInt("789"))
        })

        it("should convert pi_c correctly", () => {
            const result = snarkjsProofToContract(mockSnarkjsProof)
            expect(result.c[0]).toBe(BigInt("192021"))
            expect(result.c[1]).toBe(BigInt("222324"))
        })
    })

    describe("contractProofToStrings and stringProofToContract", () => {
        it("should round-trip correctly", () => {
            const original = {
                a: [BigInt("123"), BigInt("456")] as [bigint, bigint],
                b: [
                    [BigInt("789"), BigInt("101112")] as [bigint, bigint],
                    [BigInt("131415"), BigInt("161718")] as [bigint, bigint],
                ] as [[bigint, bigint], [bigint, bigint]],
                c: [BigInt("192021"), BigInt("222324")] as [bigint, bigint],
            }

            const asStrings = contractProofToStrings(original)
            const restored = stringProofToContract(asStrings)

            expect(restored.a[0]).toBe(original.a[0])
            expect(restored.a[1]).toBe(original.a[1])
            expect(restored.b[0][0]).toBe(original.b[0][0])
            expect(restored.b[0][1]).toBe(original.b[0][1])
            expect(restored.b[1][0]).toBe(original.b[1][0])
            expect(restored.b[1][1]).toBe(original.b[1][1])
            expect(restored.c[0]).toBe(original.c[0])
            expect(restored.c[1]).toBe(original.c[1])
        })
    })
})

// =============================================================================
// Subject Encoding Tests
// =============================================================================

describe("Subject Encoding", () => {
    describe("subjectToBytes32", () => {
        it("should return valid bytes32", () => {
            const result = subjectToBytes32("0x1234567890abcdef")
            expect(isValidBytes32(result)).toBe(true)
        })

        it("should normalize input", () => {
            const result1 = subjectToBytes32("0xABC")
            const result2 = subjectToBytes32("0xabc")
            const result3 = subjectToBytes32("  0xabc  ")
            expect(result1).toBe(result2)
            expect(result2).toBe(result3)
        })

        it("should produce deterministic output", () => {
            const result1 = subjectToBytes32("test-subject")
            const result2 = subjectToBytes32("test-subject")
            expect(result1).toBe(result2)
        })
    })

    describe("isValidBytes32", () => {
        it("should return true for valid bytes32", () => {
            expect(
                isValidBytes32(
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                )
            ).toBe(true)
            expect(
                isValidBytes32(
                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                )
            ).toBe(true)
        })

        it("should return false for invalid formats", () => {
            expect(isValidBytes32("0x123")).toBe(false) // Too short
            expect(
                isValidBytes32(
                    "0000000000000000000000000000000000000000000000000000000000000000"
                )
            ).toBe(false) // No 0x
            expect(
                isValidBytes32(
                    "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"
                )
            ).toBe(false) // Invalid hex
        })
    })
})
