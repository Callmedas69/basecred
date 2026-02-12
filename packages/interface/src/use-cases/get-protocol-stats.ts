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

  const [events, uniqueAgents] = await Promise.all([
    repo.getDecisionEvents(),
    repo.getRegisteredAgentCount(),
  ])

  // Unique subjects
  const subjectSet = new Set<string>()
  const outcomeCounts = new Map<number, number>()
  const contextCounts = new Map<number, number>()

  for (const event of events) {
    subjectSet.add(event.subjectHash)

    // Outcome aggregation
    const d = event.decision
    outcomeCounts.set(d, (outcomeCounts.get(d) ?? 0) + 1)

    // Context aggregation — context is bytes32(uint256(contextId))
    const contextId = Number(BigInt(event.context))
    contextCounts.set(contextId, (contextCounts.get(contextId) ?? 0) + 1)
  }

  // Build outcome breakdown (always include all 3 outcomes)
  const decisionsByOutcome: OutcomeBreakdown[] = [0, 1, 2].map((outcome) => ({
    outcome,
    label: OUTCOME_LABELS[outcome] ?? `UNKNOWN_${outcome}`,
    count: outcomeCounts.get(outcome) ?? 0,
  }))

  // Build context breakdown sorted by count descending
  const decisionsByContext: ContextBreakdown[] = Array.from(contextCounts.entries())
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
    totalDecisions: events.length,
    uniqueAgents,
    uniqueSubjects: subjectSet.size,
    decisionsByOutcome,
    decisionsByContext,
    lastUpdated: new Date().toISOString(),
  }
}
