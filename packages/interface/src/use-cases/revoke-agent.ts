/**
 * Revoke Agent Use Case
 *
 * Revokes an agent registration and deletes its API key.
 * Requires wallet signature verification + ownership check.
 */

import { verifyWalletSignature } from "@/lib/verifyWalletSignature"
import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import { createApiKeyRepository } from "@/repositories/apiKeyRepository"
import { sendWebhook } from "@/lib/webhook"

export class RevokeAgentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "RevokeAgentError"
    this.status = status
  }
}

export async function revokeAgent(
  claimId: string,
  address: string,
  signature: string,
  message: string
): Promise<{ success: boolean }> {
  const isValid = await verifyWalletSignature(address, signature, message)
  if (!isValid) {
    throw new RevokeAgentError("Invalid or expired wallet signature", 401)
  }

  const regRepo = createAgentRegistrationRepository()
  const registration = await regRepo.getByClaimId(claimId)

  if (!registration) {
    throw new RevokeAgentError("Registration not found", 404)
  }

  if (registration.ownerAddress !== address.toLowerCase()) {
    throw new RevokeAgentError("You do not own this registration", 403)
  }

  if (registration.status === "revoked") {
    throw new RevokeAgentError("This agent is already revoked", 409)
  }

  // Delete the API key if it was activated
  if (registration.status === "verified") {
    const keyRepo = createApiKeyRepository()
    await keyRepo.revokeKey(registration.apiKeyHash, registration.ownerAddress)
  }

  // Revoke the registration (returns pre-revoke snapshot)
  const revokedReg = await regRepo.revoke(claimId)

  // Fire webhook on revoke (fire-and-forget)
  if (revokedReg?.webhookUrl) {
    sendWebhook(revokedReg.webhookUrl, {
      event: "agent.revoked",
      timestamp: Date.now(),
      agentName: revokedReg.agentName,
      ownerAddress: revokedReg.ownerAddress,
      data: {
        claimId,
      },
    }).catch((err) => console.error("Webhook delivery failed:", err))
  }

  return { success: true }
}
