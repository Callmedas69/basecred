/**
 * Proof Format Conversion Utilities
 *
 * Converts between snarkjs proof format and contract-compatible format.
 */

/**
 * snarkjs proof format (as returned by groth16.prove)
 */
export interface SnarkjsProof {
    pi_a: [string, string, string]
    pi_b: [[string, string], [string, string], [string, string]]
    pi_c: [string, string, string]
    protocol: string
    curve: string
}

/**
 * Contract-compatible proof format
 */
export interface ContractProof {
    a: [bigint, bigint]
    b: [[bigint, bigint], [bigint, bigint]]
    c: [bigint, bigint]
}

/**
 * Convert snarkjs proof to contract-compatible format.
 * Handles the coordinate transformations required by the Groth16 verifier.
 *
 * Note: snarkjs outputs affine coordinates with a third element (1).
 * The contract expects only the x,y coordinates.
 * Also, the B point coordinates are swapped in the snarkjs output.
 *
 * @param proof The snarkjs proof object
 * @returns Contract-compatible proof with bigint values
 */
export function snarkjsProofToContract(proof: SnarkjsProof): ContractProof {
    return {
        a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
        // B point coordinates are reversed in snarkjs output
        b: [
            [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
            [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
        ],
        c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    }
}

/**
 * Convert public signals from snarkjs format to contract format.
 * snarkjs returns strings, contract expects bigints.
 *
 * @param signals Array of public signal strings
 * @returns Array of public signals as bigints
 */
export function snarkjsSignalsToContract(signals: string[]): bigint[] {
    return signals.map((s) => BigInt(s))
}

/**
 * Format proof for contract call (converts bigints to strings for JSON).
 * This is useful when sending proofs via API.
 */
export interface ContractProofStrings {
    a: [string, string]
    b: [[string, string], [string, string]]
    c: [string, string]
}

/**
 * Convert contract proof to string format for JSON serialization.
 *
 * @param proof The contract proof with bigint values
 * @returns Contract proof with string values
 */
export function contractProofToStrings(proof: ContractProof): ContractProofStrings {
    return {
        a: [proof.a[0].toString(), proof.a[1].toString()],
        b: [
            [proof.b[0][0].toString(), proof.b[0][1].toString()],
            [proof.b[1][0].toString(), proof.b[1][1].toString()],
        ],
        c: [proof.c[0].toString(), proof.c[1].toString()],
    }
}

/**
 * Parse string proof back to contract format with bigints.
 *
 * @param proof The contract proof with string values
 * @returns Contract proof with bigint values
 */
export function stringProofToContract(proof: ContractProofStrings): ContractProof {
    return {
        a: [BigInt(proof.a[0]), BigInt(proof.a[1])],
        b: [
            [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
            [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])],
        ],
        c: [BigInt(proof.c[0]), BigInt(proof.c[1])],
    }
}
