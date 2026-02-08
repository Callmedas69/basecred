/**
 * List Owner Agents Use Case
 *
 * Returns all agent registrations for a wallet address.
 * Requires wallet signature verification.
 */

import { verifyWalletSignature } from "@/lib/verifyWalletSignature"
import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import type { AgentRegistration } from "@/types/agentRegistration"

export interface OwnerAgentInfo {
  claimId: string
  agentName: string
  telegramId: string
  status: AgentRegistration["status"]
  apiKeyPrefix: string
  createdAt: number
  verifiedAt: number | null
}

export async function listOwnerAgents(
  address: string,
  signature: string,
  message: string
): Promise<OwnerAgentInfo[]> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new Error("Invalid or expired wallet signature")
  }

  const repo = createAgentRegistrationRepository()
  const registrations = await repo.listByOwner(address)

  return registrations
    .filter((r) => r.status !== "revoked")
    .map((r) => ({
      claimId: r.claimId,
      agentName: r.agentName,
      telegramId: r.telegramId,
      status: r.status,
      apiKeyPrefix: r.apiKeyPrefix,
      createdAt: r.createdAt,
      verifiedAt: r.verifiedAt,
    }))
}
