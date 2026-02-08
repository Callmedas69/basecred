import { readFile } from "fs/promises"
import type { ProofPayload, ProofPublicInputs, VerifiedProof } from "basecred-decision-engine"

const ZK_VKEY_JSON = process.env.ZK_VKEY_JSON
const ZK_VKEY_PATH = process.env.ZK_VKEY_PATH

export async function verifyGroth16Proof(
    proof: ProofPayload,
    publicInputs: ProofPublicInputs
): Promise<VerifiedProof> {
    const allowPlaintext =
        process.env.ZK_ALLOW_PLAINTEXT_SIGNALS === "true" &&
        process.env.NODE_ENV !== "production"

    if (allowPlaintext) {
        const signals = (publicInputs as { signals?: unknown }).signals
        if (!signals || typeof signals !== "object") {
            return { valid: false, error: "Missing signals in publicInputs" }
        }
        return { valid: true, signals: signals as any }
    }

    const vkey = await loadVerificationKey()
    if (!vkey) {
        return { valid: false, error: "Missing verification key configuration" }
    }

    const snarkjsProof = (proof as { snarkjsProof?: unknown }).snarkjsProof
    const snarkjsPublicSignals = (publicInputs as { snarkjsPublicSignals?: unknown }).snarkjsPublicSignals

    if (!snarkjsProof || typeof snarkjsProof !== "object") {
        return { valid: false, error: "Missing snarkjsProof" }
    }

    if (!Array.isArray(snarkjsPublicSignals)) {
        return { valid: false, error: "Missing snarkjsPublicSignals" }
    }

    const { groth16 } = await import("snarkjs")
    const valid = await groth16.verify(vkey, snarkjsPublicSignals, snarkjsProof)

    if (!valid) {
        return { valid: false, error: "Invalid proof" }
    }

    return { valid: true }
}

async function loadVerificationKey(): Promise<unknown | null> {
    if (ZK_VKEY_JSON && ZK_VKEY_JSON.trim().length > 0) {
        try {
            return JSON.parse(ZK_VKEY_JSON)
        } catch {
            return null
        }
    }

    if (ZK_VKEY_PATH && ZK_VKEY_PATH.trim().length > 0) {
        try {
            const raw = await readFile(ZK_VKEY_PATH, "utf-8")
            return JSON.parse(raw)
        } catch {
            return null
        }
    }

    return null
}
