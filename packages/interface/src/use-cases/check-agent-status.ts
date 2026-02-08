/**
 * Check Agent Status Use Case
 *
 * Simple lookup for agents polling their claim status.
 * No auth required — claimId is a 256-bit bearer token.
 */

import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"

export interface CheckAgentStatusOutput {
  status: "pending_claim" | "verified" | "expired" | "revoked"
  agentName?: string
  verificationCode?: string
  ownerAddress?: string
  expiresAt?: number
}

export async function checkAgentStatus(
  claimId: string,
  includeDetails: boolean = false
): Promise<CheckAgentStatusOutput> {
  if (!claimId) {
    throw new Error("claimId is required")
  }

  const repo = createAgentRegistrationRepository()
  const registration = await repo.getByClaimId(claimId)

  if (!registration) {
    return { status: "expired" }
  }

  if (registration.status === "revoked") {
    return { status: "revoked" }
  }

  const result: CheckAgentStatusOutput = {
    status: registration.status,
    agentName: registration.agentName,
  }

  // Include full details when requested (safe because claimId is 256-bit bearer token)
  if (includeDetails && registration.status === "pending_claim") {
    result.verificationCode = registration.verificationCode
    result.ownerAddress = registration.ownerAddress
    result.expiresAt = registration.expiresAt
  }

  return result
}
