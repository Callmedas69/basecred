import { createHash } from "crypto"
import type { PolicyDefinition } from "../repositories/policyRepository"

export type PolicyHashInput = Omit<PolicyDefinition, "policyHash">

export function computePolicyHash(input: PolicyHashInput): string {
    const payload = {
        context: input.context,
        normalizationVersion: input.normalizationVersion,
        thresholds: sortObject(input.thresholds),
    }

    const serialized = stableStringify(payload)
    const hash = createHash("sha256").update(serialized).digest("hex")

    return `sha256:${hash}`
}

function stableStringify(value: unknown): string {
    return JSON.stringify(sortObject(value))
}

function sortObject(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortObject)
    }

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>
        return Object.keys(record)
            .sort()
            .reduce<Record<string, unknown>>((acc, key) => {
                acc[key] = sortObject(record[key])
                return acc
            }, {})
    }

    return value
}
