import { describe, it, expect, vi, beforeEach } from "vitest"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import type { IDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import type { DecisionContext, Decision, ContractProofStrings } from "basecred-decision-engine"

// =============================================================================
// Mock Repository
// =============================================================================

function createMockRepository(): IDecisionRegistryRepository & {
    submitDecision: ReturnType<typeof vi.fn>
} {
    return {
        submitDecision: vi.fn().mockResolvedValue(
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as const
        ),
        getDecision: vi.fn().mockResolvedValue(null),
        getDecisionKey: vi.fn().mockResolvedValue(
            "0x0000000000000000000000000000000000000000000000000000000000000000" as const
        ),
        isAuthorizedSubmitter: vi.fn().mockResolvedValue(true),
    }
}

// =============================================================================
// Test Data
// =============================================================================

const validProof: ContractProofStrings = {
    a: ["123", "456"],
    b: [
        ["789", "101112"],
        ["131415", "161718"],
    ],
    c: ["192021", "222324"],
}

// Policy hash that results in field element 1234n after processing
const mockPolicyHash = "sha256:4d2" // 0x4d2 = 1234

// =============================================================================
// Use Case Tests
// =============================================================================

describe("submitDecisionOnChain", () => {
    let mockRepository: ReturnType<typeof createMockRepository>

    beforeEach(() => {
        mockRepository = createMockRepository()
    })

    it("should submit a valid decision", async () => {
        const input = {
            subject: "0x1234567890abcdef1234567890abcdef12345678",
            context: "allowlist.general" as DecisionContext,
            decision: "ALLOW" as Decision,
            policyHash: mockPolicyHash,
            proof: validProof,
            publicSignals: ["1234", "0", "2"] as [string, string, string],
        }

        const result = await submitDecisionOnChain(input, {
            decisionRegistryRepository: mockRepository,
        })

        expect(result.transactionHash).toBe(
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        )
        expect(result.subjectHash).toMatch(/^0x[0-9a-f]{64}$/)
        expect(result.contextBytes32).toBe(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        )
        expect(mockRepository.submitDecision).toHaveBeenCalledTimes(1)
    })

    it("should reject mismatched policy hash in public signals", async () => {
        const input = {
            subject: "0x1234567890abcdef1234567890abcdef12345678",
            context: "allowlist.general" as DecisionContext,
            decision: "ALLOW" as Decision,
            policyHash: mockPolicyHash,
            proof: validProof,
            publicSignals: ["9999", "0", "2"] as [string, string, string], // Wrong policy hash
        }

        await expect(
            submitDecisionOnChain(input, {
                decisionRegistryRepository: mockRepository,
            })
        ).rejects.toThrow("policyHash mismatch")
    })

    it("should reject mismatched context in public signals", async () => {
        const input = {
            subject: "0x1234567890abcdef1234567890abcdef12345678",
            context: "allowlist.general" as DecisionContext,
            decision: "ALLOW" as Decision,
            policyHash: mockPolicyHash,
            proof: validProof,
            publicSignals: ["1234", "99", "2"] as [string, string, string], // Wrong context
        }

        await expect(
            submitDecisionOnChain(input, {
                decisionRegistryRepository: mockRepository,
            })
        ).rejects.toThrow("contextId mismatch")
    })

    it("should reject mismatched decision in public signals", async () => {
        const input = {
            subject: "0x1234567890abcdef1234567890abcdef12345678",
            context: "allowlist.general" as DecisionContext,
            decision: "ALLOW" as Decision,
            policyHash: mockPolicyHash,
            proof: validProof,
            publicSignals: ["1234", "0", "0"] as [string, string, string], // Says DENY
        }

        await expect(
            submitDecisionOnChain(input, {
                decisionRegistryRepository: mockRepository,
            })
        ).rejects.toThrow("decision mismatch")
    })

    it("should encode different contexts correctly", async () => {
        const contexts: Array<{ context: DecisionContext; expectedId: string }> = [
            { context: "allowlist.general", expectedId: "0" },
            { context: "comment", expectedId: "1" },
            { context: "publish", expectedId: "2" },
            { context: "apply", expectedId: "3" },
            { context: "governance.vote", expectedId: "4" },
        ]

        for (const { context, expectedId } of contexts) {
            const input = {
                subject: "test-subject",
                context,
                decision: "ALLOW" as Decision,
                policyHash: mockPolicyHash,
                proof: validProof,
                publicSignals: ["1234", expectedId, "2"] as [string, string, string],
            }

            const result = await submitDecisionOnChain(input, {
                decisionRegistryRepository: mockRepository,
            })

            expect(result.transactionHash).toBeDefined()
        }
    })

    it("should encode different decisions correctly", async () => {
        const decisions: Array<{ decision: Decision; expectedValue: string }> = [
            { decision: "DENY", expectedValue: "0" },
            { decision: "ALLOW_WITH_LIMITS", expectedValue: "1" },
            { decision: "ALLOW", expectedValue: "2" },
        ]

        for (const { decision, expectedValue } of decisions) {
            const input = {
                subject: "test-subject",
                context: "allowlist.general" as DecisionContext,
                decision,
                policyHash: mockPolicyHash,
                proof: validProof,
                publicSignals: ["1234", "0", expectedValue] as [string, string, string],
            }

            const result = await submitDecisionOnChain(input, {
                decisionRegistryRepository: mockRepository,
            })

            expect(result.transactionHash).toBeDefined()
        }
    })

    it("should pass correct parameters to repository", async () => {
        const input = {
            subject: "0xtest",
            context: "comment" as DecisionContext,
            decision: "DENY" as Decision,
            policyHash: mockPolicyHash,
            proof: validProof,
            publicSignals: ["1234", "1", "0"] as [string, string, string],
        }

        await submitDecisionOnChain(input, {
            decisionRegistryRepository: mockRepository,
        })

        expect(mockRepository.submitDecision).toHaveBeenCalledWith(
            expect.objectContaining({
                decision: 0, // DENY
                a: [BigInt("123"), BigInt("456")],
                publicSignals: [BigInt("1234"), BigInt("1"), BigInt("0")],
            })
        )
    })
})
