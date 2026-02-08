import { z } from "zod"
import { VALID_CONTEXTS } from "basecred-decision-engine"

const FALLBACK_CONTEXTS = [
    "allowlist.general",
    "apply",
    "comment",
    "publish",
    "governance.vote",
]

const CONTEXTS = Array.isArray(VALID_CONTEXTS) && VALID_CONTEXTS.length > 0
    ? VALID_CONTEXTS
    : FALLBACK_CONTEXTS

export const policyHashSchema = z.string().min(1)

export const proofPayloadSchema = z.object({
    snarkjsProof: z.unknown().optional(),
    proof: z.unknown().optional(),
}).refine((value) => value.snarkjsProof !== undefined || value.proof !== undefined, {
    message: "Proof payload must include snarkjsProof or proof",
})

export const publicInputsSchema = z.object({
    policyHash: policyHashSchema,
    snarkjsPublicSignals: z.array(z.unknown()).optional(),
    signals: z.record(z.unknown()).optional(),
}).refine((value) => value.snarkjsPublicSignals !== undefined || value.signals !== undefined, {
    message: "publicInputs must include snarkjsPublicSignals or signals",
})

export const agentDecideRequestSchema = z.object({
    subject: z.string().optional(),
    context: z.string().refine((value) => CONTEXTS.includes(value as any), {
        message: `Invalid context. Must be one of: ${CONTEXTS.map((c) => `'${c}'`).join(", ")}`,
    }),
    proof: proofPayloadSchema,
    publicInputs: publicInputsSchema,
})

export type AgentDecideRequest = z.infer<typeof agentDecideRequestSchema>
