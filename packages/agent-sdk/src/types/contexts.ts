/**
 * Types for public protocol endpoints (contexts, policies, feed, stats).
 */

/** A decision context (e.g. "allowlist.general", "comment", "publish") */
export type ContextInfo = string

/** Policy info for a context */
export interface PolicyInfo {
  context: string
  policyHash: string
  normalizationVersion: number
}

/** An entry in the global activity feed */
export interface FeedEntry {
  agentName: string
  ownerAddress: string
  context: string
  txHash?: string
  timestamp: number
}

/** Outcome breakdown in protocol stats */
export interface OutcomeBreakdown {
  /** 0=DENY, 1=ALLOW_WITH_LIMITS, 2=ALLOW */
  outcome: number
  label: string
  count: number
}

/** Context breakdown in protocol stats */
export interface ContextBreakdown {
  contextId: number
  label: string
  count: number
}

/** Aggregated protocol statistics */
export interface ProtocolStats {
  totalDecisions: number
  uniqueAgents: number
  uniqueSubjects: number
  decisionsByOutcome: OutcomeBreakdown[]
  decisionsByContext: ContextBreakdown[]
  lastUpdated: string
}
