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

    return {
        async submitDecision(params: DecisionSubmissionParams): Promise<Hash> {
            if (!walletClient || !account) {
                throw new Error(
                    "Wallet client not initialized. Provide a private key for write operations."
                )
            }

            try {
                const { request } = await publicClient.simulateContract({
                    address: registryAddress,
                    abi: DECISION_REGISTRY_ABI,
                    functionName: "submitDecision",
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

                const hash = await walletClient.writeContract(request as any)
                return hash
            } catch (err: unknown) {
                // Extract the real revert reason from viem's error chain.
                // Viem wraps RPC -32000 errors as "Missing or invalid parameters"
                // which hides the actual contract revert reason (e.g. "Invalid proof").
                const reason = extractRevertReason(err)
                console.error(`[Registry] submitDecision failed: ${reason}`)
                throw err
            }
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
