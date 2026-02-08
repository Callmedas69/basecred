/**
 * Proof Repository
 *
 * Wraps the proofGenerator infrastructure behind a clean interface.
 * Allows the use case layer to generate ZK proofs without depending on
 * file system access, snarkjs WASM, or process.env directly.
 *
 * Tests can provide a mock implementation that returns fake proofs.
 */

import type { ProofGenerationInput, GeneratedProof } from "@/lib/proofGenerator"

export type { ProofGenerationInput, GeneratedProof } from "@/lib/proofGenerator"

export interface IProofRepository {
  areCircuitFilesAvailable(): Promise<boolean>
  generateProof(input: ProofGenerationInput): Promise<GeneratedProof>
}

export function createProofRepository(): IProofRepository {
  return {
    areCircuitFilesAvailable: async () => {
      const { areCircuitFilesAvailable } = await import("@/lib/proofGenerator")
      return areCircuitFilesAvailable()
    },
    generateProof: async (input: ProofGenerationInput) => {
      const { generateProof } = await import("@/lib/proofGenerator")
      return generateProof(input)
    },
  }
}
