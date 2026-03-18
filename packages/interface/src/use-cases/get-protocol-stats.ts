/**
 * Get Protocol Stats Use Case
 *
 * Aggregates on-chain decision events and Redis agent registrations
 * into protocol-level metrics. No HTTP, no framework dependencies.
 */

import { createStatsRepository } from "@/repositories/statsRepository"
import { decodeContextId } from "basecred-decision-engine"

// =============================================================================
// Types
// =============================================================================

export interface OutcomeBreakdown {
  /** 0=DENY, 1=ALLOW_WITH_LIMITS, 2=ALLOW */
  outcome: number
  label: string
  count: number
}

export interface ContextBreakdown {
  contextId: number
  label: string
  count: number
}

export interface ProtocolStats {
  totalDecisions: number
  uniqueAgents: number
  uniqueSubjects: number
  decisionsByOutcome: OutcomeBreakdown[]
  decisionsByContext: ContextBreakdown[]
  lastUpdated: string
}

// =============================================================================
// Outcome labels
// =============================================================================

const OUTCOME_LABELS: Record<number, string> = {
  0: "DENY",
  1: "ALLOW_WITH_LIMITS",
  2: "ALLOW",
}

// =============================================================================
// Use Case
// =============================================================================

export async function getProtocolStats(): Promise<ProtocolStats> {
  const repo = createStatsRepository()

  const [onChainStats, uniqueAgents] = await Promise.all([
    repo.getOnChainStats(),
    repo.getRegisteredAgentCount(),
  ])

  // Build outcome breakdown (always include all 3 outcomes)
  const decisionsByOutcome: OutcomeBreakdown[] = [
    { outcome: 0, label: OUTCOME_LABELS[0], count: onChainStats.denyCount },
    { outcome: 1, label: OUTCOME_LABELS[1], count: onChainStats.allowWithLimitsCount },
    { outcome: 2, label: OUTCOME_LABELS[2], count: onChainStats.allowCount },
  ]

  // Build context breakdown sorted by count descending
  const decisionsByContext: ContextBreakdown[] = Array.from(
    onChainStats.contextCounts.entries()
  )
    .map(([contextId, count]) => {
      let label: string
      try {
        label = decodeContextId(contextId)
      } catch {
        console.warn(`Unknown context ID in stats: ${contextId}`)
        label = `unknown (${contextId})`
      }
      return { contextId, label, count }
    })
    .sort((a, b) => b.count - a.count)

  return {
    totalDecisions: onChainStats.totalDecisions,
    uniqueAgents,
    uniqueSubjects: onChainStats.uniqueSubjects,
    decisionsByOutcome,
    decisionsByContext,
    lastUpdated: new Date().toISOString(),
  }
}
