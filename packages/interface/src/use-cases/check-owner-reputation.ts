/**
 * Check Owner Reputation Use Case
 *
 * When an agent calls POST /api/v1/agent/check-owner, this use case:
 * 1. Looks up the owner's wallet from the API key
 * 2. Fetches the owner's profile once
 * 3. Runs the decision engine for ALL 5 contexts
 * 4. Optionally generates ZK proofs for each context (withProof=true)
 * 5. Builds a natural language summary
 * 6. Logs activity + pushes to global feed (fire-and-forget)
 */

import {
  executeDecision,
  normalizeSignals,
  encodeSignalsForCircuit,
  encodeContextId,
  InMemoryPolicyRepository,
  listPolicies,
  VALID_CONTEXTS,
  type NormalizedSignals,
  type ContractProofStrings,
  type DecisionContext,
  type Decision,
} from "basecred-decision-engine"
import { getUnifiedProfile, type SDKConfig } from "basecred-sdk"
import { createApiKeyRepository } from "@/repositories/apiKeyRepository"
import { createActivityRepository } from "@/repositories/activityRepository"
import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import type { IProofRepository } from "@/repositories/proofRepository"
import type { IDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { createDecisionRegistryRepository } from "@/repositories/decisionRegistryRepository"
import { submitDecisionOnChain } from "@/use-cases/submit-decision-onchain"
import type { ActivityEntry } from "@/types/apiKeys"
import type { GlobalFeedEntry } from "@/types/agentRegistration"
import { sendWebhook } from "@/lib/webhook"

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
    existing?: boolean
    error?: string
  }
}

export interface CheckOwnerReputationOutput {
  ownerAddress: string
  agentName: string
  zkEnabled: boolean
  summary: string
  results: Record<string, ContextResult>
}

interface CheckOwnerReputationOptions {
  withProof?: boolean
  submitOnChain?: boolean
}

interface CheckOwnerReputationDeps {
  proofRepository?: IProofRepository
  decisionRegistryRepository?: IDecisionRegistryRepository
}

export async function checkOwnerReputation(
  apiKeyHash: string,
  options?: CheckOwnerReputationOptions,
  deps?: CheckOwnerReputationDeps,
): Promise<CheckOwnerReputationOutput> {
  const withProof = options?.withProof ?? false

  // 1. Look up API key to get walletAddress
  const keyRepo = createApiKeyRepository()
  const keyRecord = await keyRepo.validateKey(apiKeyHash)
  if (!keyRecord) {
    throw new CheckOwnerReputationError("API key not found", 401)
  }

  const ownerAddress = keyRecord.walletAddress

  // 2. Find the agent registration linked to this key
  const regRepo = createAgentRegistrationRepository()
  const registrations = await regRepo.listByOwner(ownerAddress)
  const registration = registrations.find(
    (r) => r.apiKeyHash === apiKeyHash && r.status === "verified"
  )
  const agentName = registration?.agentName || keyRecord.label || "unknown"

  // 3. If ZK proofs requested, validate dependencies and circuit availability
  if (withProof) {
    if (!deps?.proofRepository) {
      throw new CheckOwnerReputationError("Proof repository not available", 500)
    }
    const circuitsReady = await deps.proofRepository.areCircuitFilesAvailable()
    if (!circuitsReady) {
      throw new CheckOwnerReputationError("ZK circuit files are not available", 503)
    }
  }

  // 4. Fetch owner profile once
  const config: SDKConfig = {
    ethos: {
      baseUrl: process.env.ETHOS_BASE_URL || "https://api.ethos.network",
      clientId: process.env.ETHOS_CLIENT_ID || "",
    },
    talent: {
      baseUrl: process.env.TALENT_BASE_URL || "https://api.talentprotocol.com",
      apiKey: process.env.TALENT_API_KEY || "",
    },
    farcaster: {
      enabled: true,
      neynarApiKey: process.env.NEYNAR_API_KEY || "",
    },
  }

  const rawProfile = await getUnifiedProfile(ownerAddress, config)
  const profileData = {
    ethos: (rawProfile.ethos as any) ?? null,
    neynar: (rawProfile.farcaster as any) ?? null,
    talent: (rawProfile.talent as any) ?? null,
    lastActivityAt: null,
  }

  // 5. Normalize signals once
  const signals = normalizeSignals(profileData)

  // 6. Build results — either with ZK proofs or standard decision engine
  let results: Record<string, ContextResult>

  if (withProof) {
    results = await buildResultsWithProof(
      signals,
      deps!.proofRepository!,
    )
  } else {
    results = await buildResultsWithDecisionEngine(
      ownerAddress,
      profileData,
    )
  }

  // 6b. Submit proofs on-chain (sequential to avoid nonce collisions)
  const submitOnChain = options?.submitOnChain ?? withProof
  if (withProof && submitOnChain) {
    const relayerKey = process.env.RELAYER_PRIVATE_KEY
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
        } catch (err: any) {
          // viem wraps revert reasons in nested error structures
          const reason = err.cause?.reason || err.shortMessage || err.message || ""
          if (reason.includes("already submitted")) {
            result.onChain = { submitted: true, existing: true }
          } else {
            console.error(`On-chain submit failed for ${contextKey}:`, reason)
            result.onChain = { submitted: false, error: reason }
          }
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

  // 8. Log activity + push to global feed (fire-and-forget)
  logActivitiesAndFeed(apiKeyHash, ownerAddress, agentName, keyRecord.keyPrefix, results).catch(
    (err) => console.error("Activity/feed logging failed:", err)
  )

  // 9. Fire webhook if registration has a webhookUrl (fire-and-forget)
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
    }).catch((err) => console.error("Webhook delivery failed:", err))
  }

  // Record usage
  keyRepo.recordUsage(apiKeyHash).catch((err) =>
    console.error("Usage recording failed:", err)
  )

  return { ownerAddress, agentName, zkEnabled: withProof, summary, results }
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
      constraints: [],
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
  apiKeyHash: string,
  ownerAddress: string,
  agentName: string,
  keyPrefix: string,
  results: Record<string, ContextResult>
): Promise<void> {
  const activityRepo = createActivityRepository()
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
      ownerAddress: ownerAddress.slice(0, 6) + "..." + ownerAddress.slice(-4),
      context,
      decision: result.decision,
      confidence: result.confidence,
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
  MODERATE: "moderate trust",
  NEUTRAL: "neutral trust",
  LOW: "low trust",
  VERY_LOW: "very low trust",
}

const CAPABILITY_LABELS: Record<string, string> = {
  EXPERT: "strong builder credentials",
  PROFICIENT: "solid builder credentials",
  INTERMEDIATE: "growing builder credentials",
  MODERATE: "emerging builder credentials",
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
