/**
 * Policy Hash Encoding Utilities
 *
 * Converts policy hash strings to circuit/contract-compatible field elements.
 * See: packages/contracts/circuits/CIRCUIT_SPEC.md
 */

/**
 * BN254 scalar field order (r).
 * Policy hashes must be reduced mod r to be valid field elements.
 * This is the same as the Groth16 scalar field.
 */
export const BN254_FIELD_ORDER = BigInt(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
)

/**
 * Strip the "sha256:" prefix from a policy hash.
 *
 * @param hash Policy hash with or without prefix
 * @returns The raw hex hash without prefix
 */
export function stripPolicyHashPrefix(hash: string): string {
    if (hash.startsWith("sha256:")) {
        return hash.slice(7)
    }
    return hash
}

/**
 * Convert a policy hash to a field element (bigint < BN254 field order).
 * The hash is interpreted as a big-endian unsigned integer and reduced mod r.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns The field element as bigint
 */
export function policyHashToFieldElement(hash: string): bigint {
    const hexHash = stripPolicyHashPrefix(hash)

    // Validate hex string
    if (!/^[0-9a-fA-F]+$/.test(hexHash)) {
        throw new Error(`Invalid hex in policy hash: ${hexHash}`)
    }

    // Convert to bigint
    const value = BigInt("0x" + hexHash)

    // Reduce mod field order to ensure valid field element
    return value % BN254_FIELD_ORDER
}

/**
 * Convert a policy hash to bytes32 format for on-chain use.
 * The field element is left-padded to 32 bytes.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns The policy hash as 0x-prefixed bytes32 hex string
 */
export function policyHashToBytes32(hash: string): `0x${string}` {
    const fieldElement = policyHashToFieldElement(hash)
    return `0x${fieldElement.toString(16).padStart(64, "0")}` as `0x${string}`
}

/**
 * Check if a policy hash would fit in the BN254 field without reduction.
 * Useful for validation and debugging.
 *
 * @param hash Policy hash string (with or without sha256: prefix)
 * @returns true if the hash is already a valid field element
 */
export function isPolicyHashValidFieldElement(hash: string): boolean {
    const hexHash = stripPolicyHashPrefix(hash)

    if (!/^[0-9a-fA-F]+$/.test(hexHash)) {
        return false
    }

    const value = BigInt("0x" + hexHash)
    return value < BN254_FIELD_ORDER
}
