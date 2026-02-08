import { describe, it, expect } from "vitest"
import { executeDecisionWithProof } from "../use-cases/decide-with-proof"
import { InMemoryPolicyRepository } from "../repositories/inMemoryPolicyRepository"
import type { ProofVerifier, ProofPayload, ProofPublicInputs } from "../types/proofs"
import type { NormalizedSignals } from "../types/signals"

const policyRepository = new InMemoryPolicyRepository()

function createSignals(overrides: Partial<NormalizedSignals> = {}): NormalizedSignals {
    return {
        trust: "HIGH",
        socialTrust: "HIGH",
        builder: "EXPERT",
        creator: "EXPERT",
        recencyDays: 10,
        spamRisk: "NEUTRAL",
        signalCoverage: 1.0,
        ...overrides,
    }
}

describe("executeDecisionWithProof", () => {
    it("returns a decision when proof is valid", async () => {
        const signals = createSignals()
        const policy = await policyRepository.getPolicyByContext("allowlist.general")

        const proofVerifier: ProofVerifier = {
            verify: async () => ({ valid: true, signals }),
        }

        const result = await executeDecisionWithProof(
            {
                context: "allowlist.general",
                proof: { proof: "stub" } as ProofPayload,
                publicInputs: { policyHash: policy!.policyHash } as ProofPublicInputs,
            },
            { policyRepository, proofVerifier }
        )

        expect(result.decision).toBe("ALLOW")
        expect(result.policyHash).toBe(policy!.policyHash)
        expect(result.explain.length).toBeGreaterThan(0)
    })

    it("throws when policy hash mismatches", async () => {
        const proofVerifier: ProofVerifier = {
            verify: async () => ({ valid: true, signals: createSignals() }),
        }

        await expect(
            executeDecisionWithProof(
                {
                    context: "comment",
                    proof: { proof: "stub" } as ProofPayload,
                    publicInputs: { policyHash: "sha256:bad" } as ProofPublicInputs,
                },
                { policyRepository, proofVerifier }
            )
        ).rejects.toThrow("Policy hash mismatch")
    })

    it("throws when proof is invalid", async () => {
        const policy = await policyRepository.getPolicyByContext("comment")

        const proofVerifier: ProofVerifier = {
            verify: async () => ({ valid: false, error: "Invalid proof" }),
        }

        await expect(
            executeDecisionWithProof(
                {
                    context: "comment",
                    proof: { proof: "stub" } as ProofPayload,
                    publicInputs: { policyHash: policy!.policyHash } as ProofPublicInputs,
                },
                { policyRepository, proofVerifier }
            )
        ).rejects.toThrow("Invalid proof")
    })
})
