/**
 * Verify Agent Claim Use Case
 *
 * Verifies the owner's tweet contains the verification code,
 * then activates the agent's API key via the existing apiKeyRepository.
 */

import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"
import { createApiKeyRepository } from "@/repositories/apiKeyRepository"
import { sendWebhook } from "@/lib/webhook"

// Anchored regex: username must be alphanumeric/underscores, URL must end after status ID (optional trailing slash or query)
const TWEET_URL_REGEX = /^https:\/\/(x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/status\/\d+\/?(\?[^#]*)?$/
const OEMBED_TIMEOUT_MS = 10_000

export class VerifyAgentClaimError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "VerifyAgentClaimError"
    this.status = status
  }
}

export async function verifyAgentClaim(
  claimId: string,
  tweetUrl: string
): Promise<{ success: boolean }> {
  if (!claimId) {
    throw new VerifyAgentClaimError("claimId is required", 400)
  }

  if (!tweetUrl || !TWEET_URL_REGEX.test(tweetUrl)) {
    throw new VerifyAgentClaimError(
      "Valid tweet URL required (https://x.com/user/status/... or https://twitter.com/user/status/...)",
      400
    )
  }

  const regRepo = createAgentRegistrationRepository()
  const registration = await regRepo.getByClaimId(claimId)

  if (!registration) {
    throw new VerifyAgentClaimError("Registration not found or expired", 404)
  }

  if (registration.status === "verified") {
    throw new VerifyAgentClaimError("This agent is already verified", 409)
  }

  if (registration.status === "revoked") {
    throw new VerifyAgentClaimError("This registration has been revoked", 410)
  }

  // Defense-in-depth: check expiration even though Redis TTL should handle it
  if (registration.expiresAt < Date.now()) {
    throw new VerifyAgentClaimError("Registration has expired. Please register again.", 410)
  }

  // Fetch tweet content via oEmbed
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`

  let tweetHtml: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS)

    const response = await fetch(oembedUrl, {
      signal: controller.signal,
      redirect: "error", // Prevent following redirects (SSRF protection)
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new VerifyAgentClaimError(
        "Could not fetch tweet. Make sure the tweet is public and the URL is correct.",
        422
      )
    }

    // Validate response is JSON before parsing
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
      throw new VerifyAgentClaimError(
        "Unexpected response from tweet verification. Please try again.",
        422
      )
    }

    const data = await response.json()
    tweetHtml = data.html || ""
  } catch (error) {
    if (error instanceof VerifyAgentClaimError) throw error
    throw new VerifyAgentClaimError(
      "Failed to verify tweet. Please check the URL and try again.",
      422
    )
  }

  // Check if verification code is present in tweet
  if (!tweetHtml.toLowerCase().includes(registration.verificationCode.toLowerCase())) {
    throw new VerifyAgentClaimError(
      "Tweet does not contain the required verification code.",
      422
    )
  }

  // Activate the API key via existing apiKeyRepository
  const apiKeyRepo = createApiKeyRepository()
  await apiKeyRepo.createKey(
    registration.ownerAddress,
    registration.agentName,
    registration.apiKeyHash,
    registration.apiKeyPrefix
  )

  // Mark registration as verified
  await regRepo.markVerified(claimId, tweetUrl)

  // Fire webhook on verification (fire-and-forget)
  if (registration.webhookUrl) {
    sendWebhook(registration.webhookUrl, {
      event: "agent.verified",
      timestamp: Date.now(),
      agentName: registration.agentName,
      ownerAddress: registration.ownerAddress,
      data: {
        claimId,
        apiKeyPrefix: registration.apiKeyPrefix,
      },
    }).catch((err) => console.error("Webhook delivery failed:", err))
  }

  return { success: true }
}
