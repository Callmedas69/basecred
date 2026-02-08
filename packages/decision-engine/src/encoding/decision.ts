/**
 * Decision Value Encoding/Decoding
 *
 * Maps Decision strings to numeric values for circuit/contract use.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

import type { Decision } from "../types/rules"

/**
 * Decision value mappings (matches CIRCUIT_SPEC.md)
 */
export const DECISION_VALUE_MAP: Record<Decision, number> = {
    DENY: 0,
    ALLOW_WITH_LIMITS: 1,
    ALLOW: 2,
}

/**
 * Reverse mapping for decoding
 */
const VALUE_TO_DECISION: Record<number, Decision> = {
    0: "DENY",
    1: "ALLOW_WITH_LIMITS",
    2: "ALLOW",
}

/**
 * Encode a Decision to its numeric value for circuit/contract use.
 *
 * @param decision The decision string
 * @returns The numeric decision value (0-2)
 * @throws Error if decision is not valid
 */
export function encodeDecision(decision: Decision): number {
    const value = DECISION_VALUE_MAP[decision]
    if (value === undefined) {
        throw new Error(`Unknown decision: ${decision}`)
    }
    return value
}

/**
 * Decode a numeric decision value back to Decision string.
 *
 * @param value The numeric decision value
 * @returns The Decision string
 * @throws Error if value is not valid
 */
export function decodeDecision(value: number): Decision {
    const decision = VALUE_TO_DECISION[value]
    if (decision === undefined) {
        throw new Error(`Unknown decision value: ${value}`)
    }
    return decision
}
