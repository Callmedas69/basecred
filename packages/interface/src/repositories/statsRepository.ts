/**
 * Stats Repository
 *
 * Fetches on-chain DecisionSubmitted events and Redis agent counts.
 * No business logic — raw data access only.
 *
 * Uses incremental scanning: events are cached in Redis, and only new blocks
 * are scanned on subsequent requests. This keeps RPC usage minimal.
 *
 * Dual-RPC strategy:
 * - Cold start / large catch-up: Base public RPC (supports 5000-block ranges)
 * - Incremental scans: configured RPC / Alchemy (10-block limit but more reliable)
 */

import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { DECISION_REGISTRY_ABI } from "@basecred/contracts/abi"
import { ONCHAIN_CONTRACTS } from "@/lib/onChainContracts"
import { CHAIN_CONFIG } from "@/lib/blockchainConfig"
import { getRedis } from "@/lib/redis"

// Block at which the DecisionRegistry proxy was deployed on Base Mainnet (from DeployProxy.s.sol/8453/run-latest.json)
const DEPLOY_BLOCK = 42_367_644n

// Redis keys for incremental event cache
const REDIS_KEY_EVENTS = "stats:decision-events"
const REDIS_KEY_LAST_BLOCK = "stats:last-scanned-block"

// Threshold: if scan range exceeds this, use bulk client (Base public RPC)
const BULK_SCAN_THRESHOLD = 100n

// Base public RPC supports up to ~10,000-block ranges; use 5,000 for safety
const BULK_CHUNK_SIZE = 5_000n

// Alchemy Free tier limits eth_getLogs to 10 blocks per call
const INCREMENTAL_CHUNK_SIZE = 10n

// Throttle between chunks during large scans to avoid overwhelming Base public RPC
const BULK_THROTTLE_MS = 200

// Save progress to Redis every 50K blocks during bulk scans so failures don't lose everything
const CHECKPOINT_BLOCKS = 50_000n

export interface DecisionEvent {
  subjectHash: `0x${string}`
  context: `0x${string}`
  decision: number
  policyHash: `0x${string}`
  timestamp: bigint
}

// Serializable version for Redis storage (bigint → string)
interface SerializedDecisionEvent {
  subjectHash: string
  context: string
  decision: number
  policyHash: string
  timestamp: string
}

export interface OnChainStats {
  totalDecisions: number
  uniqueSubjects: number
  denyCount: number
  allowWithLimitsCount: number
  allowCount: number
  contextCounts: Map<number, number>
}

export interface IStatsRepository {
  getDecisionEvents(): Promise<DecisionEvent[]>
  getRegisteredAgentCount(): Promise<number>
  getOnChainStats(): Promise<OnChainStats>
}

function getRegistryAddress(): `0x${string}` {
  const registry = ONCHAIN_CONTRACTS.find((c) => c.name === "Decision Registry (Proxy)")
  if (!registry) {
    throw new Error("Decision Registry contract not found in ONCHAIN_CONTRACTS")
  }
  return registry.address as `0x${string}`
}

/**
 * Retry a function up to maxAttempts times with exponential backoff (1s, 2s, 4s).
 */
async function retryRpc<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= maxAttempts - 1) throw err
      const delay = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s — exponential backoff
      console.warn(`[statsRepository] RPC call failed (attempt ${attempt + 1}), retrying in ${delay / 1000}s...`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error("unreachable")
}

function serializeEvents(events: DecisionEvent[]): SerializedDecisionEvent[] {
  return events.map((e) => ({
    subjectHash: e.subjectHash,
    context: e.context,
    decision: e.decision,
    policyHash: e.policyHash,
    timestamp: e.timestamp.toString(),
  }))
}

function deserializeEvents(raw: SerializedDecisionEvent[]): DecisionEvent[] {
  return raw.map((e) => ({
    subjectHash: e.subjectHash as `0x${string}`,
    context: e.context as `0x${string}`,
    decision: e.decision,
    policyHash: e.policyHash as `0x${string}`,
    timestamp: BigInt(e.timestamp),
  }))
}

// Module-level lock: prevents concurrent cold-start scans (thundering herd)
let activeScan: Promise<DecisionEvent[]> | null = null

export function createStatsRepository(): IStatsRepository {
  // Large historical scans: Base public RPC (supports 5000-block ranges, no 10-block limit)
  const bulkClient = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  })

  // Incremental scans: configured RPC (Alchemy preferred, more reliable for small ranges)
  const incrementalClient = createPublicClient({
    chain: base,
    transport: http(CHAIN_CONFIG.rpcUrl),
  })

  const registryAddress = getRegistryAddress()

  /**
   * Scan a block range for DecisionSubmitted events.
   * Picks client + chunk size based on the scan range.
   */
  async function scanChunked(
    client: typeof bulkClient,
    fromBlock: bigint,
    toBlock: bigint,
    chunkSize: bigint,
    maxAttempts: number,
    throttleMs: number,
  ): Promise<DecisionEvent[]> {
    const events: DecisionEvent[] = []

    for (let from = fromBlock; from <= toBlock; from += chunkSize) {
      const to = from + chunkSize - 1n > toBlock ? toBlock : from + chunkSize - 1n
      const logs = await retryRpc(
        () =>
          client.getContractEvents({
            address: registryAddress,
            abi: DECISION_REGISTRY_ABI,
            eventName: "DecisionSubmitted",
            fromBlock: from,
            toBlock: to,
          }),
        maxAttempts
      )

      for (const log of logs) {
        const args = log.args
        events.push({
          subjectHash: args.subjectHash!,
          context: args.context!,
          decision: args.decision!,
          policyHash: args.policyHash!,
          timestamp: args.timestamp!,
        })
      }

      // Throttle between chunks to avoid overwhelming the RPC
      if (throttleMs > 0 && from + chunkSize <= toBlock) {
        await new Promise((r) => setTimeout(r, throttleMs))
      }
    }

    return events
  }

  async function saveProgress(
    events: DecisionEvent[],
    lastBlock: bigint,
  ): Promise<void> {
    try {
      const redis = getRedis()
      await Promise.all([
        redis.set(REDIS_KEY_EVENTS, JSON.stringify(serializeEvents(events))),
        redis.set(REDIS_KEY_LAST_BLOCK, lastBlock.toString()),
      ])
    } catch (err) {
      console.error("[statsRepository] Failed to persist event cache to Redis:", err)
    }
  }

  return {
    async getDecisionEvents(): Promise<DecisionEvent[]> {
      // Reuse in-flight scan to prevent thundering herd on cold start
      if (activeScan) {
        return activeScan
      }

      const doScan = async (): Promise<DecisionEvent[]> => {
        try {
          const redis = getRedis()
          const latestBlock = await retryRpc(() => incrementalClient.getBlockNumber())

          const [cachedEventsRaw, lastBlockRaw] = await Promise.all([
            redis.get<string>(REDIS_KEY_EVENTS),
            redis.get<string>(REDIS_KEY_LAST_BLOCK),
          ])

          let cachedEvents: DecisionEvent[] = []
          let scanFrom = DEPLOY_BLOCK

          if (cachedEventsRaw && lastBlockRaw) {
            try {
              const parsed = typeof cachedEventsRaw === "string"
                ? JSON.parse(cachedEventsRaw) as SerializedDecisionEvent[]
                : cachedEventsRaw as unknown as SerializedDecisionEvent[]
              cachedEvents = deserializeEvents(parsed)
              scanFrom = BigInt(String(lastBlockRaw)) + 1n
            } catch {
              console.warn("[statsRepository] Corrupted event cache, performing full rescan")
            }
          }

          if (scanFrom > latestBlock) {
            return cachedEvents
          }

          const range = latestBlock - scanFrom + 1n

          if (range > BULK_SCAN_THRESHOLD) {
            // Bulk scan with intermediate Redis checkpoints so progress survives 503s
            console.log(`[statsRepository] Bulk scan: ${range} blocks via Base public RPC (${BULK_CHUNK_SIZE}-block chunks)`)
            const allEvents = [...cachedEvents]
            let currentFrom = scanFrom
            const startLen = allEvents.length

            while (currentFrom <= latestBlock) {
              const checkpointEnd = currentFrom + CHECKPOINT_BLOCKS - 1n > latestBlock
                ? latestBlock
                : currentFrom + CHECKPOINT_BLOCKS - 1n

              const segmentEvents = await scanChunked(
                bulkClient, currentFrom, checkpointEnd, BULK_CHUNK_SIZE, 3, BULK_THROTTLE_MS,
              )
              allEvents.push(...segmentEvents)

              // Checkpoint — if a later segment fails, this progress is preserved
              await saveProgress(allEvents, checkpointEnd)
              currentFrom = checkpointEnd + 1n
            }

            console.log(`[statsRepository] Bulk scan complete: ${allEvents.length - startLen} events found`)
            return allEvents
          }

          // Incremental scan (small range, use Alchemy)
          const newEvents = await scanChunked(
            incrementalClient, scanFrom, latestBlock, INCREMENTAL_CHUNK_SIZE, 2, 0,
          )
          const allEvents = [...cachedEvents, ...newEvents]
          await saveProgress(allEvents, latestBlock)
          return allEvents
        } finally {
          activeScan = null
        }
      }

      activeScan = doScan()
      return activeScan
    },

    async getOnChainStats(): Promise<OnChainStats> {
      const stats = await retryRpc(() =>
        incrementalClient.readContract({
          address: registryAddress,
          abi: DECISION_REGISTRY_ABI,
          functionName: "getStats",
        })
      )

      const KNOWN_CONTEXT_IDS = [0, 1, 2, 3, 4]
      const counts = await Promise.all(
        KNOWN_CONTEXT_IDS.map((id) =>
          retryRpc(() =>
            incrementalClient.readContract({
              address: registryAddress,
              abi: DECISION_REGISTRY_ABI,
              functionName: "getContextDecisionCount",
              args: [(`0x${id.toString(16).padStart(64, "0")}`) as `0x${string}`],
            })
          )
        )
      )

      const contextCounts = new Map<number, number>()
      for (let i = 0; i < KNOWN_CONTEXT_IDS.length; i++) {
        const count = Number(counts[i])
        if (count > 0) {
          contextCounts.set(KNOWN_CONTEXT_IDS[i], count)
        }
      }

      return {
        totalDecisions: Number(stats.totalDecisions),
        uniqueSubjects: Number(stats.uniqueSubjectCount),
        denyCount: Number(stats.denyCount),
        allowWithLimitsCount: Number(stats.allowWithLimitsCount),
        allowCount: Number(stats.allowCount),
        contextCounts,
      }
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
