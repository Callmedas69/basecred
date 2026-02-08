/**
 * Subject Hash Encoding Utilities
 *
 * Converts subject identifiers to bytes32 format for on-chain use.
 */

import { createHash } from "crypto"

/**
 * Hash a subject identifier (wallet address or FID) to bytes32.
 * Uses SHA-256 for consistent, collision-resistant hashing.
 *
 * @param subject The subject identifier (wallet address or FID)
 * @returns The subject as 0x-prefixed bytes32 hex string
 */
export function subjectToBytes32(subject: string): `0x${string}` {
    const normalized = subject.toLowerCase().trim()
    const hash = createHash("sha256").update(normalized).digest("hex")
    return `0x${hash}` as `0x${string}`
}

/**
 * Validate that a string is a valid bytes32 hex string.
 *
 * @param value The value to validate
 * @returns true if valid bytes32 format
 */
export function isValidBytes32(value: string): value is `0x${string}` {
    return /^0x[0-9a-fA-F]{64}$/.test(value)
}
