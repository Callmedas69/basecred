/**
 * Log Submission Feed Use Case
 *
 * Logs a GlobalFeedEntry when an agent submits a decision on-chain
 * via the two-step flow (decide-with-proof -> submit).
 */

import { createActivityRepository, type IActivityRepository } from "@/repositories/activityRepository"
import { createApiKeyRepository, type IApiKeyRepository } from "@/repositories/apiKeyRepository"
import { createAgentRegistrationRepository, type IAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import type { GlobalFeedEntry } from "@/types/agentRegistration"
import { truncateAddress } from "@/lib/utils"

export interface LogSubmissionFeedInput {
  apiKeyHash: string
  subject: string
  context: string
  txHash: string
}

export interface LogSubmissionFeedDeps {
  apiKeyRepository?: IApiKeyRepository
  agentRegistrationRepository?: IAgentRegistrationRepository
  activityRepository?: IActivityRepository
}

/**
 * Resolves agent identity from the API key and logs a feed entry.
 */
export async function logSubmissionFeed(
  input: LogSubmissionFeedInput,
  deps?: LogSubmissionFeedDeps,
): Promise<void> {
  const keyRepo = deps?.apiKeyRepository ?? createApiKeyRepository()
  const regRepo = deps?.agentRegistrationRepository ?? createAgentRegistrationRepository()
  const activityRepo = deps?.activityRepository ?? createActivityRepository()

  const keyRecord = await keyRepo.validateKey(input.apiKeyHash)
  if (!keyRecord) return

  const ownerAddress = keyRecord.walletAddress

  const registrations = await regRepo.listByOwner(ownerAddress)
  const registration = registrations.find(
    (r) => r.apiKeyHash === input.apiKeyHash && r.status === "verified"
  )
  const agentName = registration?.agentName || keyRecord.label || "unknown"

  const feedEntry: GlobalFeedEntry = {
    agentName,
    ownerAddress: truncateAddress(input.subject),
    context: input.context,
    txHash: input.txHash,
    timestamp: Date.now(),
  }

  await activityRepo.logGlobalFeedEntry(feedEntry)
}
