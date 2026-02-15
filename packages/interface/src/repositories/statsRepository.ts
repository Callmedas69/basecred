/**
 * Stats Repository
 *
 * Fetches on-chain DecisionSubmitted events and Redis agent counts.
 * No business logic — raw data access only.
 */

import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { DECISION_REGISTRY_ABI } from "@basecred/contracts/abi"
import { ONCHAIN_CONTRACTS } from "@/lib/onChainContracts"
import { getRedis } from "@/lib/redis"

// Block at which the DecisionRegistry was deployed on Base Mainnet (from broadcast/8453/run-latest.json)
const DEPLOY_BLOCK = 42_105_937n

export interface DecisionEvent {
  subjectHash: `0x${string}`
  context: `0x${string}`
  decision: number
  policyHash: `0x${string}`
  timestamp: bigint
}

export interface IStatsRepository {
  getDecisionEvents(): Promise<DecisionEvent[]>
  getRegisteredAgentCount(): Promise<number>
}

function getRegistryAddress(): `0x${string}` {
  const registry = ONCHAIN_CONTRACTS.find((c) => c.name === "Decision Registry")
  if (!registry) {
    throw new Error("Decision Registry contract not found in ONCHAIN_CONTRACTS")
  }
  return registry.address as `0x${string}`
}

export function createStatsRepository(): IStatsRepository {
  // Use Base public RPC for event scanning — Alchemy Free tier limits eth_getLogs to 10 blocks
  const publicClient = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  })

  const registryAddress = getRegistryAddress()

  // Max block range per eth_getLogs call (safe for most RPC providers)
  const CHUNK_SIZE = 5000n

  return {
    async getDecisionEvents(): Promise<DecisionEvent[]> {
      const latestBlock = await publicClient.getBlockNumber()
      const allEvents: DecisionEvent[] = []

      for (let from = DEPLOY_BLOCK; from <= latestBlock; from += CHUNK_SIZE) {
        const to = from + CHUNK_SIZE - 1n > latestBlock ? latestBlock : from + CHUNK_SIZE - 1n
        const logs = await publicClient.getContractEvents({
          address: registryAddress,
          abi: DECISION_REGISTRY_ABI,
          eventName: "DecisionSubmitted",
          fromBlock: from,
          toBlock: to,
        })

        for (const log of logs) {
          const args = log.args
          allEvents.push({
            subjectHash: args.subjectHash!,
            context: args.context!,
            decision: args.decision!,
            policyHash: args.policyHash!,
            timestamp: args.timestamp!,
          })
        }
      }

      return allEvents
    },

    async getRegisteredAgentCount(): Promise<number> {
      const redis = getRedis()
      let count = 0
      let cursor = 0

      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: "agent:reg:*", count: 100 })
        count += keys.length
        cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor
      } while (cursor !== 0)

      return count
    },
  }
}
