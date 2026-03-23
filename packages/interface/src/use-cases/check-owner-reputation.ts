/**
 * Check Owner Reputation Use Case
 *
 * When an agent calls POST /api/v1/agent/check-owner, this use case:
 * 1. Looks up the owner's wallet from the API key
 * 2. Fetches the owner's profile once
 * 3. Runs the decision engine for ALL 5 contexts
 * 4. Generates ZK proofs for each context
 * 5. Builds a natural language summary
 * 6. Logs activity + pushes to global feed (awaited)
 */

import {
  executeDecision,
  normalizeSignals,
  encodeSignalsForCircuit,
  encodeContextId,
  InMemoryPolicyRepository,
  listPolicies,
  resolveBlockingFactors,
  deriveBlockingFactorsForContext,
  VALID_CONTEXTS,
  type NormalizedSignals,
  type ContractProofStrings,
  type DecisionContext,
  type Decision,
} from "basecred-decision-engine"
import { createApiKeyRepository, type IApiKeyRepository } from "@/repositories/apiKeyRepository"
import { createActivityRepository, type IActivityRepository } from "@/repositories/activityRepository"
import { createAgentRegistrationRepository, type IAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import { createProofRepository, type IProofRepository } from "@/repositories/proofRepository"
import type { IDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import type { ActivityEntry } from "@/types/apiKeys"
import type { GlobalFeedEntry } from "@/types/agentRegistration"
import { fetchLiveProfile } from "@/repositories/liveProfileRepository"
import { sendWebhook } from "@/lib/webhook"
import { extractRevertReason } from "@/lib/errors"
import { getRelayerPrivateKey } from "@/lib/serverConfig"
import { truncateAddress } from "@/lib/utils"
import { deriveConstraintsForContext } from "@/lib/decisionHelpers"

export class CheckOwnerReputationError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "CheckOwnerReputationError"
    this.status = status
  }
}

interface ContextResult {
  decision: string
  confidence: string
  constraints: string[]
  blockingFactors?: string[]
  verified?: boolean
  proof?: ContractProofStrings
  publicSignals?: [string, string, string]
  policyHash?: string
  contextId?: number
  onChain?: {
    submitted: boolean
    txHash?: string
    error?: string
  }
}

export interface CheckOwnerReputationOutput {
  ownerAddress: string
  agentName: string
  zkEnabled: boolean
  summary: string
  formattedReport: string
  signals: NormalizedSignals
  results: Record<string, ContextResult>
}

interface CheckOwnerReputationOptions {
  withProof?: boolean
  submitOnChain?: boolean
}

interface CheckOwnerReputationDeps {
  apiKeyRepository?: IApiKeyRepository
  agentRegistrationRepository?: IAgentRegistrationRepository
  activityRepository?: IActivityRepository
  proofRepository?: IProofRepository
  decisionRegistryRepository?: IDecisionRegistryRepository
}

export async function checkOwnerReputation(
  apiKeyHash: string,
  options?: CheckOwnerReputationOptions,
  deps?: CheckOwnerReputationDeps,
): Promise<CheckOwnerReputationOutput> {
  const withProof = options?.withProof ?? false
  const submitOnChain = options?.submitOnChain ?? withProof

  // Resolve dependencies — injected or created inline
  const keyRepo = deps?.apiKeyRepository ?? createApiKeyRepository()
  const regRepo = deps?.agentRegistrationRepository ?? createAgentRegistrationRepository()

  // 1. Look up API key to get walletAddress
  const keyRecord = await keyRepo.validateKey(apiKeyHash)
  if (!keyRecord) {
    throw new CheckOwnerReputationError("API key not found", 401)
  }

  const ownerAddress = keyRecord.walletAddress

  // 2. Find the agent registration linked to this key
  const registrations = await regRepo.listByOwner(ownerAddress)
  const registration = registrations.find(
    (r) => r.apiKeyHash === apiKeyHash && r.status === "verified"
  )
  const agentName = registration?.agentName || keyRecord.label || "unknown"

  // 3. If ZK proofs requested, resolve proof repository and validate circuit availability
  const proofRepo = withProof
    ? (deps?.proofRepository ?? createProofRepository())
    : undefined

  if (withProof) {
    if (!proofRepo) {
      throw new CheckOwnerReputationError("Proof repository not available", 500)
    }
    const circuitsReady = await proofRepo.areCircuitFilesAvailable()
    if (!circuitsReady) {
      throw new CheckOwnerReputationError("ZK circuit files are not available", 503)
    }
  }

  // 4. Fetch owner profile once (goes through cached repository layer)
  const profileData = await fetchLiveProfile(ownerAddress)

  // 5. Normalize signals once
  const signals = normalizeSignals(profileData)

  // 6. Build results — either with ZK proofs or standard decision engine
  let results: Record<string, ContextResult>

  if (withProof) {
    results = await buildResultsWithProof(
      signals,
      proofRepo!,
    )
  } else {
    results = await buildResultsWithDecisionEngine(
      ownerAddress,
      profileData,
    )
  }

  // 6b. Submit proofs on-chain (sequential to avoid nonce collisions)
  if (withProof && submitOnChain) {
    const relayerKey = getRelayerPrivateKey()
    if (relayerKey) {
      const registryRepo = deps?.decisionRegistryRepository
        ?? createDecisionRegistryRepository(relayerKey)

      for (const [contextKey, result] of Object.entries(results)) {
        if (!result.proof || !result.publicSignals || !result.policyHash) continue
        try {
          const output = await submitDecisionOnChain(
            {
              subject: ownerAddress,
              context: contextKey as DecisionContext,
              decision: result.decision as Decision,
              policyHash: result.policyHash,
              proof: result.proof,
              publicSignals: result.publicSignals,
            },
            { decisionRegistryRepository: registryRepo }
          )
          result.onChain = { submitted: true, txHash: output.transactionHash }
        } catch (err: unknown) {
          const reason = extractRevertReason(err)
          console.error(`On-chain submit failed for ${contextKey}:`, reason)
          result.onChain = { submitted: false, error: reason }
        }
      }
    } else {
      for (const result of Object.values(results)) {
        if (result.proof) {
          result.onChain = { submitted: false, error: "Relayer not configured" }
        }
      }
    }
  }

  // 7. Build natural language summary
  const summary = buildReputationSummary(signals, results)

  // 8. Log activity + push to global feed (awaited — fast Redis ops, must complete before Vercel terminates)
  const activityRepo = deps?.activityRepository ?? createActivityRepository()
  try {
    await logActivitiesAndFeed(activityRepo, ownerAddress, agentName, keyRecord.keyPrefix, results)
  } catch (err) {
    console.error("[check-owner-reputation] Activity/feed logging failed:", err)
  }

  // 9. Fire webhook if registration has a webhookUrl (best-effort, non-blocking, HMAC-signed)
  if (registration?.webhookUrl) {
    sendWebhook(registration.webhookUrl, {
      event: "reputation.checked",
      timestamp: Date.now(),
      agentName,
      ownerAddress,
      data: {
        summary,
        results: Object.fromEntries(
          Object.entries(results).map(([ctx, r]) => [
            ctx,
            { decision: r.decision, confidence: r.confidence },
          ])
        ),
      },
    }, registration.apiKeyHash).catch((err) => console.error("[check-owner-reputation] Webhook delivery failed:", err))
  }

  // Record usage (awaited — must complete before Vercel terminates)
  try {
    await keyRepo.recordUsage(apiKeyHash)
  } catch (err) {
    console.error("[check-owner-reputation] Usage recording failed:", err)
  }

  const formattedReport = buildFormattedReport(ownerAddress, signals, results, summary)

  return { ownerAddress, agentName, zkEnabled: withProof, summary, formattedReport, signals, results }
}

// ─────────────────────────────────────────────────────────────────────────────
// Result Builders
// ─────────────────────────────────────────────────────────────────────────────

async function buildResultsWithDecisionEngine(
  ownerAddress: string,
  profileData: any,
): Promise<Record<string, ContextResult>> {
  const profileFetcher = async () => profileData

  const contextResults = await Promise.all(
    VALID_CONTEXTS.map(async (context) => {
      const result = await executeDecision(
        { subject: ownerAddress, context },
        profileFetcher
      )
      return { context, result }
    })
  )

  const results: Record<string, ContextResult> = {}
  for (const { context, result } of contextResults) {
    results[context] = {
      decision: result.decision,
      confidence: result.confidence,
      constraints: result.constraints || [],
      blockingFactors: result.blockingFactors,
    }
  }
  return results
}

async function buildResultsWithProof(
  signals: NormalizedSignals,
  proofRepository: IProofRepository,
): Promise<Record<string, ContextResult>> {
  const circuitSignals = encodeSignalsForCircuit(signals)
  const policyRepository = new InMemoryPolicyRepository()
  const policies = await listPolicies({ policyRepository })

  // Pre-compute blocking factors once for all contexts
  const blockingSnapshot = resolveBlockingFactors(signals)

  const results: Record<string, ContextResult> = {}

  // Sequential — snarkjs WASM is CPU-bound, Promise.all adds no benefit
  for (const context of VALID_CONTEXTS) {
    const policy = policies.find((p) => p.context === context)
    if (!policy) {
      throw new CheckOwnerReputationError(
        `No policy found for context: ${context}`,
        500,
      )
    }

    const contextId = encodeContextId(context)
    const proofResult = await proofRepository.generateProof({
      circuitSignals,
      policyHash: policy.policyHash,
      contextId,
    })

    results[context] = {
      decision: proofResult.decision,
      confidence: "HIGH",
      verified: true,
      constraints: deriveConstraintsForContext(proofResult.decision, context),
      blockingFactors: proofResult.decision === "DENY"
        ? deriveBlockingFactorsForContext(context as DecisionContext, blockingSnapshot, signals)
        : undefined,
      proof: proofResult.proof,
      publicSignals: proofResult.publicSignals,
      policyHash: policy.policyHash,
      contextId,
    }
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Logging
// ─────────────────────────────────────────────────────────────────────────────

async function logActivitiesAndFeed(
  activityRepo: IActivityRepository,
  ownerAddress: string,
  agentName: string,
  keyPrefix: string,
  results: Record<string, ContextResult>
): Promise<void> {
  const now = Date.now()

  const promises: Promise<void>[] = []

  for (const [context, result] of Object.entries(results)) {
    // Activity log per context
    const entry: ActivityEntry = {
      timestamp: now,
      apiKeyPrefix: keyPrefix,
      subject: ownerAddress,
      context,
      decision: result.decision,
      confidence: result.confidence,
    }
    promises.push(activityRepo.logActivity(entry))

    // Global feed per context (via repository, not direct Redis)
    const feedEntry: GlobalFeedEntry = {
      agentName,
      ownerAddress: truncateAddress(ownerAddress),
      context,
      txHash: result.onChain?.txHash,
      timestamp: now,
    }
    promises.push(activityRepo.logGlobalFeedEntry(feedEntry))
  }

  await Promise.all(promises)
}

// ─────────────────────────────────────────────────────────────────────────────
// Natural Language Summary Builder
// ─────────────────────────────────────────────────────────────────────────────

const TRUST_LABELS: Record<string, string> = {
  VERY_HIGH: "very high trust",
  HIGH: "high trust",
  NEUTRAL: "neutral trust",
  LOW: "low trust",
  VERY_LOW: "very low trust",
}

const CAPABILITY_LABELS: Record<string, string> = {
  ELITE: "exceptional builder credentials",
  EXPERT: "strong builder credentials",
  BUILDER: "solid builder credentials",
  EXPLORER: "early-stage builder credentials",
}

const CONTEXT_LABELS: Record<string, string> = {
  "allowlist.general": "allowlist access",
  comment: "commenting",
  publish: "publishing",
  apply: "applications",
  "governance.vote": "governance voting",
}

function buildReputationSummary(
  signals: NormalizedSignals,
  results: Record<string, ContextResult>
): string {
  const parts: string[] = []

  // Opening — reputation strength
  const decisions = Object.values(results).map((r) => r.decision)
  const allowCount = decisions.filter((d) => d === "ALLOW").length
  const denyCount = decisions.filter((d) => d === "DENY").length

  if (allowCount === decisions.length) {
    parts.push("Your reputation is strong.")
  } else if (denyCount === 0) {
    parts.push("Your reputation is solid with some areas for improvement.")
  } else if (denyCount <= 2) {
    parts.push("Your reputation is mixed — some areas need attention.")
  } else {
    parts.push("Your reputation needs improvement across several areas.")
  }

  // Signal highlights
  const highlights: string[] = []
  const trustLabel = TRUST_LABELS[signals.trust] || signals.trust.toLowerCase()
  const socialLabel = TRUST_LABELS[signals.socialTrust] || signals.socialTrust.toLowerCase()
  const builderLabel = CAPABILITY_LABELS[signals.builder] || signals.builder.toLowerCase()

  highlights.push(`You have ${trustLabel} on Ethos`)
  if (signals.socialTrust !== signals.trust) {
    highlights.push(`${socialLabel} on Farcaster`)
  }
  highlights.push(`${builderLabel} via Talent Protocol`)
  parts.push(highlights.join(", ") + ".")

  // Context breakdown
  const approved: string[] = []
  const limited: string[] = []
  const denied: string[] = []

  for (const [context, result] of Object.entries(results)) {
    const label = CONTEXT_LABELS[context] || context
    if (result.decision === "ALLOW") approved.push(label)
    else if (result.decision === "ALLOW_WITH_LIMITS") limited.push(label)
    else denied.push(label)
  }

  if (approved.length > 0) {
    parts.push(`You're approved for ${approved.join(", ")}.`)
  }
  if (limited.length > 0) {
    parts.push(`${limited.join(", ")} ${limited.length === 1 ? "has" : "have"} limited access.`)
  }
  if (denied.length > 0) {
    parts.push(`${denied.join(", ")} ${denied.length === 1 ? "requires" : "require"} further reputation building.`)
  }

  // Actionable advice
  const advice: string[] = []
  if (signals.signalCoverage < 0.5) {
    advice.push("connect more accounts to increase signal coverage")
  }
  if (signals.trust === "LOW" || signals.trust === "VERY_LOW") {
    advice.push("build your Ethos trust score")
  }
  if (signals.socialTrust === "LOW" || signals.socialTrust === "VERY_LOW") {
    advice.push("increase your Farcaster presence")
  }
  if (signals.recencyDays > 30) {
    advice.push("increase your on-chain activity (last active " + signals.recencyDays + " days ago)")
  }

  if (advice.length > 0) {
    parts.push("To improve: " + advice.join(", ") + ".")
  }

  return parts.join(" ")
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatted Report Builder (server-built, agent-forwarded)
// ─────────────────────────────────────────────────────────────────────────────

const SIGNAL_DISPLAY: Record<string, string> = {
  VERY_HIGH: "Very High",
  HIGH: "High",
  MODERATE: "Moderate",
  NEUTRAL: "Neutral",
  LOW: "Low",
  VERY_LOW: "Very Low",
}

const BUILDER_DISPLAY: Record<string, string> = {
  ELITE: "Elite",
  EXPERT: "Expert",
  PROFICIENT: "Proficient",
  INTERMEDIATE: "Intermediate",
  MODERATE: "Moderate",
  EXPLORER: "Explorer",
}

const CONSTRAINT_DISPLAY: Record<string, string> = {
  review_queue: "Content will be placed in a review queue",
  reduced_access: "Reduced access granted",
  rate_limited: "Rate limited",
  activity_required: "More on-chain activity required",
  probation_period: "New account probation period",
  limited_actions: "Limited actions allowed",
  review_required: "Manual review required",
  reduced_weight: "Governance vote weight reduced",
}

const BLOCKING_FACTOR_DISPLAY: Record<string, string> = {
  trust: "on-chain trust",
  socialTrust: "social presence",
  builder: "builder track record",
  creator: "creator track record",
  spamRisk: "spam risk flag",
  signalCoverage: "identity verification coverage",
}

const CONTEXT_REPORT_LABELS: Record<string, string> = {
  "allowlist.general": "Allowlist",
  comment: "Comment",
  publish: "Publish",
  apply: "Apply",
  "governance.vote": "Governance",
}

function displaySignal(value: string): string {
  return SIGNAL_DISPLAY[value] ?? BUILDER_DISPLAY[value] ?? value
}

function buildFormattedReport(
  ownerAddress: string,
  signals: NormalizedSignals,
  results: Record<string, ContextResult>,
  summary: string
): string {
  const date = new Date().toISOString().split("T")[0]
  const lines: string[] = []

  lines.push("zkBaseCred Reputation Report")
  lines.push(`Wallet: ${ownerAddress}`)
  lines.push(`Date: ${date}`)
  lines.push("")
  lines.push(`Overall: ${summary}`)
  lines.push("")
  lines.push("--- Wallet Score ---")
  lines.push("")
  lines.push(`  On-chain Trust:    ${displaySignal(signals.trust)}`)
  lines.push(`  Social Trust:      ${displaySignal(signals.socialTrust)}`)
  lines.push(`  Builder:           ${displaySignal(signals.builder)}`)
  lines.push(`  Creator:           ${displaySignal(signals.creator)}`)
  lines.push("")
  lines.push("--- Access by Context ---")
  lines.push("")

  for (const [context, result] of Object.entries(results)) {
    const label = CONTEXT_REPORT_LABELS[context] ?? context
    const pad = " ".repeat(Math.max(1, 14 - label.length))
    lines.push(`  ${label}:${pad}${result.decision} (${result.confidence})`)
  }

  lines.push("")
  lines.push("--- Constraints ---")

  const constraintEntries: string[] = []
  for (const [context, result] of Object.entries(results)) {
    if (result.constraints && result.constraints.length > 0) {
      const label = CONTEXT_REPORT_LABELS[context] ?? context
      const descriptions = result.constraints.map(
        (c) => CONSTRAINT_DISPLAY[c] ?? c
      )
      constraintEntries.push(`  - ${label}: ${descriptions.join("; ")}`)
    }
  }
  if (constraintEntries.length > 0) {
    lines.push("")
    lines.push(...constraintEntries)
  } else {
    lines.push("None")
  }

  lines.push("")
  lines.push("--- Blocking Factors ---")

  const blockingEntries: string[] = []
  for (const [context, result] of Object.entries(results)) {
    if (result.blockingFactors && result.blockingFactors.length > 0) {
      const label = CONTEXT_REPORT_LABELS[context] ?? context
      const descriptions = result.blockingFactors.map(
        (f) => BLOCKING_FACTOR_DISPLAY[f] ?? f
      )
      blockingEntries.push(
        `  - ${label}: ${descriptions.join(" and ")} need${descriptions.length === 1 ? "s" : ""} improvement`
      )
    }
  }
  if (blockingEntries.length > 0) {
    lines.push("")
    lines.push(...blockingEntries)
  } else {
    lines.push("None")
  }

  lines.push("")
  lines.push("--- What This Means ---")

  const decisions = Object.values(results).map((r) => r.decision)
  const allowCount = decisions.filter((d) => d === "ALLOW").length
  const denyCount = decisions.filter((d) => d === "DENY").length
  const limitedCount = decisions.filter((d) => d === "ALLOW_WITH_LIMITS").length

  const allowContexts = Object.entries(results)
    .filter(([, r]) => r.decision === "ALLOW")
    .map(([c]) => CONTEXT_REPORT_LABELS[c] ?? c)
  const limitedContexts = Object.entries(results)
    .filter(([, r]) => r.decision === "ALLOW_WITH_LIMITS")
    .map(([c]) => CONTEXT_REPORT_LABELS[c] ?? c)
  const deniedContexts = Object.entries(results)
    .filter(([, r]) => r.decision === "DENY")
    .map(([c]) => CONTEXT_REPORT_LABELS[c] ?? c)

  const meaningParts: string[] = []
  if (allowCount === decisions.length) {
    meaningParts.push("You're approved across all categories.")
  } else {
    if (allowContexts.length > 0) {
      meaningParts.push(`You're trusted for ${allowContexts.join(", ").toLowerCase()}.`)
    }
    if (limitedContexts.length > 0) {
      meaningParts.push(`${limitedContexts.join(", ")} ${limitedCount === 1 ? "has" : "have"} limited access.`)
    }
    if (deniedContexts.length > 0) {
      meaningParts.push(`${deniedContexts.join(", ")} ${denyCount === 1 ? "requires" : "require"} stronger credentials.`)
    }
  }

  const advice: string[] = []
  if (signals.signalCoverage < 0.5) {
    advice.push("connect more accounts to increase signal coverage")
  }
  if (signals.trust === "LOW" || signals.trust === "VERY_LOW") {
    advice.push("build your on-chain trust through community participation")
  }
  if (signals.socialTrust === "LOW" || signals.socialTrust === "VERY_LOW") {
    advice.push("increase your social presence")
  }
  if (advice.length > 0) {
    meaningParts.push("To improve: " + advice.join(", ") + ".")
  }

  lines.push(meaningParts.join(" "))

  lines.push("")
  lines.push("--- On-Chain Proof ---")

  const txHashes = Object.values(results)
    .map((r) => r.onChain?.txHash)
    .filter(Boolean)
  const errors = Object.values(results)
    .map((r) => r.onChain?.error)
    .filter(Boolean)

  if (txHashes.length > 0) {
    lines.push(`Verified with zero-knowledge proof. Transaction: ${txHashes[0]}`)
  } else if (errors.length > 0) {
    lines.push(`On-chain submission failed: ${errors[0]}`)
  } else {
    lines.push("No on-chain submission attempted.")
  }

  return lines.join("\n")
}
