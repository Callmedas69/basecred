/**
 * Context ID Encoding/Decoding
 *
 * Maps DecisionContext strings to numeric IDs for circuit/contract use.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

import type { DecisionContext } from "../types/decisions"

/**
 * Context ID mappings (matches CIRCUIT_SPEC.md)
 */
export const CONTEXT_ID_MAP: Record<DecisionContext, number> = {
    "allowlist.general": 0,
    "comment": 1,
    "publish": 2,
    "apply": 3,
    "governance.vote": 4,
}

/**
 * Reverse mapping for decoding
 */
const ID_TO_CONTEXT: Record<number, DecisionContext> = {
    0: "allowlist.general",
    1: "comment",
    2: "publish",
    3: "apply",
    4: "governance.vote",
}

/**
 * Encode a DecisionContext to its numeric ID for circuit/contract use.
 *
 * @param context The decision context string
 * @returns The numeric context ID (0-4)
 * @throws Error if context is not valid
 */
export function encodeContextId(context: DecisionContext): number {
    const id = CONTEXT_ID_MAP[context]
    if (id === undefined) {
        throw new Error(`Unknown context: ${context}`)
    }
    return id
}

/**
 * Decode a numeric context ID back to DecisionContext string.
 *
 * @param id The numeric context ID
 * @returns The DecisionContext string
 * @throws Error if ID is not valid
 */
export function decodeContextId(id: number): DecisionContext {
    const context = ID_TO_CONTEXT[id]
    if (context === undefined) {
        throw new Error(`Unknown context ID: ${id}`)
    }
    return context
}

/**
 * Convert a context ID to bytes32 format for on-chain use.
 * The contract expects context as bytes32(uint256(contextId)).
 *
 * @param context The decision context
 * @returns The context as 0x-prefixed bytes32 hex string
 */
export function contextToBytes32(context: DecisionContext): `0x${string}` {
    const id = encodeContextId(context)
    return `0x${id.toString(16).padStart(64, "0")}` as `0x${string}`
}
