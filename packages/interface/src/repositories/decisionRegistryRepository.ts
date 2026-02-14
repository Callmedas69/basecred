/**
 * Decision Registry Repository
 *
 * Abstracts on-chain access to the DecisionRegistry contract.
 * Follows repository pattern: fetches/persists data, no business logic.
 */

import {
    createPublicClient,
    createWalletClient,
    http,
    type Hash,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { DECISION_REGISTRY_ABI } from "@basecred/contracts/abi"
import { ONCHAIN_CONTRACTS } from "@/lib/onChainContracts"
import { targetChain } from "@/lib/blockchainConfig"
import { extractRevertReason } from "@/lib/errors"

// =============================================================================
// Types
// =============================================================================

/**
 * Parameters for submitting a decision on-chain.
 */
export interface DecisionSubmissionParams {
    /** Hashed subject identifier (bytes32) */
    subjectHash: `0x${string}`
    /** Encoded context (bytes32) */
    context: `0x${string}`
    /** Decision value (0=DENY, 1=ALLOW_WITH_LIMITS, 2=ALLOW) */
    decision: number
    /** Policy hash as field element (bytes32) */
    policyHash: `0x${string}`
    /** Proof point A [2] */
    a: readonly [bigint, bigint]
    /** Proof point B [2][2] */
    b: readonly [readonly [bigint, bigint], readonly [bigint, bigint]]
    /** Proof point C [2] */
    c: readonly [bigint, bigint]
    /** Public signals [3] - [policyHash, contextId, decision] */
    publicSignals: readonly [bigint, bigint, bigint]
}

/**
 * On-chain decision record.
 */
export interface DecisionRecord {
    decision: number
    policyHash: `0x${string}`
    timestamp: bigint
    submitter: `0x${string}`
}

/**
 * Repository interface for DecisionRegistry contract.
 */
export interface IDecisionRegistryRepository {
    /**
     * Submit a decision with ZK proof to the registry.
     * @returns Transaction hash
     */
    submitDecision(params: DecisionSubmissionParams): Promise<Hash>

    /**
     * Get a stored decision by its key components.
     */
    getDecision(
        subjectHash: `0x${string}`,
        context: `0x${string}`,
        policyHash: `0x${string}`
    ): Promise<DecisionRecord | null>

    /**
     * Compute the decision key for a given subject/context/policy.
     */
    getDecisionKey(
        subjectHash: `0x${string}`,
        context: `0x${string}`,
        policyHash: `0x${string}`
    ): Promise<`0x${string}`>

    /**
     * Check if an address is authorized to submit decisions.
     */
    isAuthorizedSubmitter(address: `0x${string}`): Promise<boolean>
}

// =============================================================================
// Implementation
// =============================================================================

function getRegistryAddress(): `0x${string}` {
    const registry = ONCHAIN_CONTRACTS.find((c) => c.name === "Decision Registry")
    if (!registry) {
        throw new Error("Decision Registry contract not found in ONCHAIN_CONTRACTS")
    }
    return registry.address as `0x${string}`
}

/**
 * Create a DecisionRegistry repository instance.
 *
 * @param privateKey Optional private key for write operations (0x-prefixed)
 */
export function createDecisionRegistryRepository(
    privateKey?: string
): IDecisionRegistryRepository {
    const publicClient = createPublicClient({
        chain: targetChain,
        transport: http(),
    })

    const account = privateKey
        ? privateKeyToAccount(privateKey as `0x${string}`)
        : undefined

    const walletClient = account
        ? createWalletClient({
              chain: targetChain,
              transport: http(),
              account,
          })
        : undefined

    const registryAddress = getRegistryAddress()

    // Track nonce locally for sequential batch submissions.
    // viem's auto-nonce races when multiple txs are sent without waiting
    // for confirmations — the RPC returns the same nonce for back-to-back calls.
    let managedNonce: number | undefined = undefined

    return {
        async submitDecision(params: DecisionSubmissionParams): Promise<Hash> {
            if (!walletClient || !account) {
                throw new Error(
                    "Wallet client not initialized. Provide a private key for write operations."
                )
            }

            // Initialize nonce on first call (or after a failure reset)
            if (managedNonce === undefined) {
                managedNonce = await publicClient.getTransactionCount({
                    address: account.address,
                    blockTag: "pending",
                })
            }

            // Simulate with one retry for transient RPC errors.
            // Base public RPC occasionally returns "Missing or invalid parameters"
            // (viem wraps RPC -32000) on valid calls — a retry usually succeeds.
            const { request } = await retrySimulate(publicClient, {
                address: registryAddress,
                abi: DECISION_REGISTRY_ABI,
                functionName: "submitDecision" as const,
                args: [
                    params.subjectHash,
                    params.context,
                    params.decision,
                    params.policyHash,
                    params.a,
                    params.b,
                    params.c,
                    params.publicSignals,
                ],
                account,
            })

            // Submit with explicit nonce to prevent race conditions
            let hash: Hash
            try {
                hash = await walletClient.writeContract({
                    ...request,
                    nonce: managedNonce,
                } as any)
            } catch (writeErr: unknown) {
                // Nonce state is uncertain — reset so next call re-fetches
                managedNonce = undefined
                const reason = extractRevertReason(writeErr)
                console.error(`[Registry] writeContract failed: ${reason}`)
                throw writeErr
            }

            // Nonce consumed (even if tx later reverts on-chain)
            managedNonce++

            // Wait for tx confirmation before returning.
            // This ensures the RPC node's state is fresh for the next submission.
            try {
                await publicClient.waitForTransactionReceipt({
                    hash,
                    confirmations: 1,
                    timeout: 30_000,
                })
            } catch {
                // Receipt wait failed (timeout or on-chain revert) but tx was submitted.
                // Nonce was already incremented. Return the hash — caller handles errors.
                console.warn(`[Registry] receipt wait failed for ${hash}, tx was submitted`)
            }

            return hash
        },

        async getDecision(
            subjectHash: `0x${string}`,
            context: `0x${string}`,
            policyHash: `0x${string}`
        ): Promise<DecisionRecord | null> {
            const result = await publicClient.readContract({
                address: registryAddress,
                abi: DECISION_REGISTRY_ABI,
                functionName: "getDecision",
                args: [subjectHash, context, policyHash],
            })

            const record = result as {
                decision: number
                policyHash: `0x${string}`
                timestamp: bigint
                submitter: `0x${string}`
            }

            // Check if record exists (timestamp > 0 indicates a valid record)
            if (record.timestamp === BigInt(0)) {
                return null
            }

            return record
        },

        async getDecisionKey(
            subjectHash: `0x${string}`,
            context: `0x${string}`,
            policyHash: `0x${string}`
        ): Promise<`0x${string}`> {
            const result = await publicClient.readContract({
                address: registryAddress,
                abi: DECISION_REGISTRY_ABI,
                functionName: "getDecisionKey",
                args: [subjectHash, context, policyHash],
            })

            return result as `0x${string}`
        },

        async isAuthorizedSubmitter(address: `0x${string}`): Promise<boolean> {
            const result = await publicClient.readContract({
                address: registryAddress,
                abi: DECISION_REGISTRY_ABI,
                functionName: "authorizedSubmitters",
                args: [address],
            })

            return result as boolean
        },
    }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Retry simulateContract once for transient RPC errors.
 *
 * Base public RPC occasionally returns -32000 "Missing or invalid parameters"
 * on perfectly valid calls. Alchemy is more reliable but can also hiccup.
 * One retry with a 1s delay handles the common case.
 */
async function retrySimulate(
    client: ReturnType<typeof createPublicClient>,
    params: Parameters<ReturnType<typeof createPublicClient>["simulateContract"]>[0],
    maxAttempts = 2,
): Promise<{ request: any }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await client.simulateContract(params)
        } catch (err: unknown) {
            if (attempt < maxAttempts - 1 && isTransientRpcError(err)) {
                console.warn(
                    `[Registry] simulateContract transient error (attempt ${attempt + 1}), retrying in 1s...`
                )
                await new Promise((r) => setTimeout(r, 1000))
                continue
            }
            throw err
        }
    }
    throw new Error("unreachable")
}

/**
 * Detect transient RPC errors that are worth retrying.
 */
function isTransientRpcError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err)
    const shortMessage = (err as any)?.shortMessage || ""
    const combined = `${message} ${shortMessage}`.toLowerCase()
    return (
        combined.includes("missing or invalid parameters") ||
        combined.includes("timeout") ||
        combined.includes("rate limit") ||
        combined.includes("request failed") ||
        combined.includes("internal json-rpc error")
    )
}
