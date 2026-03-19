/**
 * Verify Agent Claim via Wallet Signature
 *
 * Alternative to tweet verification: owner signs a message with their wallet
 * to prove they own the address associated with the agent registration.
 */

import { verifyMessage } from "viem"
import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import { createApiKeyRepository } from "@/repositories/apiKeyRepository"
import { sendWebhook } from "@/lib/webhook"

export class VerifyAgentClaimWalletError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "VerifyAgentClaimWalletError"
    this.status = status
  }
}

/**
 * Expected message format:
 * "I am verifying my zkBaseCred agent.\n\nClaim ID: {claimId}\nVerification Code: {code}"
 */
function buildExpectedMessage(claimId: string, verificationCode: string): string {
  return `I am verifying my zkBaseCred agent.\n\nClaim ID: ${claimId}\nVerification Code: ${verificationCode}`
}

export async function verifyAgentClaimWallet(
  claimId: string,
  signature: string,
  message: string
): Promise<{ success: boolean }> {
  if (!claimId) {
    throw new VerifyAgentClaimWalletError("claimId is required", 400)
  }

  if (!signature || typeof signature !== "string" || !message || typeof message !== "string") {
    throw new VerifyAgentClaimWalletError("signature and message must be non-empty strings", 400)
  }

  // Validate signature format: must be a 0x-prefixed hex string (65 bytes = 130 hex chars + 0x prefix)
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new VerifyAgentClaimWalletError("Invalid signature format", 400)
  }

  const regRepo = createAgentRegistrationRepository()
  const registration = await regRepo.getByClaimId(claimId)

  if (!registration) {
    throw new VerifyAgentClaimWalletError("Registration not found or expired", 404)
  }

  if (registration.status === "verified") {
    throw new VerifyAgentClaimWalletError("This agent is already verified", 409)
  }

  if (registration.status === "revoked") {
    throw new VerifyAgentClaimWalletError("This registration has been revoked", 410)
  }

  // Defense-in-depth: check expiration even though Redis TTL should handle it
  if (registration.expiresAt < Date.now()) {
    throw new VerifyAgentClaimWalletError("Registration has expired. Please register again.", 410)
  }

  // Verify the message content matches expected format
  const expectedMessage = buildExpectedMessage(claimId, registration.verificationCode)
  if (message !== expectedMessage) {
    throw new VerifyAgentClaimWalletError(
      "Message does not match expected format. Please sign the exact message provided.",
      422
    )
  }

  // Verify the signature matches the registration's owner address
  let isValid: boolean
  try {
    isValid = await verifyMessage({
      address: registration.ownerAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
  } catch {
    throw new VerifyAgentClaimWalletError("Failed to verify wallet signature", 422)
  }

  if (!isValid) {
    throw new VerifyAgentClaimWalletError(
      "Wallet signature is invalid or does not match the registered owner address",
      422
    )
  }

  // Activate the API key via existing apiKeyRepository (atomic with max key cap)
  const MAX_KEYS_PER_WALLET = 20
  const apiKeyRepo = createApiKeyRepository()
  const created = await apiKeyRepo.createKey(
    registration.ownerAddress,
    registration.agentName,
    registration.apiKeyHash,
    registration.apiKeyPrefix,
    MAX_KEYS_PER_WALLET
  )
  if (!created) {
    throw new VerifyAgentClaimWalletError(
      `Maximum API key limit reached (${MAX_KEYS_PER_WALLET}). Revoke unused keys first.`,
      409
    )
  }

  // Mark registration as verified (tweetUrl is null for wallet verification)
  await regRepo.markVerified(claimId, null)

  // Fire webhook on verification (fire-and-forget, HMAC-signed)
  if (registration.webhookUrl) {
    sendWebhook(registration.webhookUrl, {
      event: "agent.verified",
      timestamp: Date.now(),
      agentName: registration.agentName,
      ownerAddress: registration.ownerAddress,
      data: {
        claimId,
        apiKeyPrefix: registration.apiKeyPrefix,
        verificationType: "wallet",
      },
    }, registration.apiKeyHash).catch((err) => console.error("Webhook delivery failed:", err))
  }

  return { success: true }
}
