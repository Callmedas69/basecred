/**
 * Types for reputation check results.
 * Mirrors CheckOwnerReputationOutput from the API.
 */

/** Trust tier values from the decision engine */
export type Tier = "VERY_LOW" | "LOW" | "NEUTRAL" | "HIGH" | "VERY_HIGH"

/** Builder/Creator capability values */
export type Capability = "EXPLORER" | "BUILDER" | "EXPERT" | "ELITE"

/** Normalized reputation signals from external providers */
export interface NormalizedSignals {
  /** Aggregated long-term trust (from Ethos) */
  trust: Tier
  /** Social legitimacy (from Neynar/Farcaster) */
  socialTrust: Tier
  /** Technical credibility (from Talent Protocol) */
  builder: Capability
  /** Content/community credibility (from Talent Protocol) */
  creator: Capability
  /** Days since last on-chain activity */
  recencyDays: number
  /** Spam risk indicator (from Neynar) */
  spamRisk: Tier
  /** Percentage of signals successfully fetched (0-1) */
  signalCoverage: number
}

/** ZK proof strings for on-chain verification */
export interface ContractProofStrings {
  a: [string, string]
  b: [[string, string], [string, string]]
  c: [string, string]
}

/** On-chain submission status for a single context */
export interface OnChainStatus {
  submitted: boolean
  txHash?: string
  error?: string
}

/** Decision result for a single context */
export interface ContextResult {
  decision: string
  confidence: string
  constraints: string[]
  blockingFactors?: string[]
  verified?: boolean
  proof?: ContractProofStrings
  publicSignals?: [string, string, string]
  policyHash?: string
  contextId?: number
  onChain?: OnChainStatus
}

/** Full reputation check result */
export interface ReputationResult {
  ownerAddress: string
  agentName: string
  zkEnabled: boolean
  summary: string
  signals: NormalizedSignals
  results: Record<string, ContextResult>
}
