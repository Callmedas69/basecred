/**
 * Register Agent Use Case
 *
 * Handles agent self-registration. The agent receives an API key immediately,
 * but the key is NOT active until the owner claims it via tweet verification.
 */

import { createHash, randomBytes } from "crypto"
import { isAddress } from "viem"
import { createAgentRegistrationRepository } from "@/repositories/agentRegistrationRepository"

const KEY_PREFIX = "bc_"
const TTL_24H_MS = 24 * 60 * 60 * 1000

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

function makeKeyPrefix(key: string): string {
  return key.slice(0, 12) + "..." + key.slice(-4)
}

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  const bytes = randomBytes(4)
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return `BASECRED-${code}`
}

const AGENT_NAME_REGEX = /^[a-zA-Z0-9_]{2,64}$/

export interface RegisterAgentInput {
  agentName: string
  telegramId: string
  ownerAddress: string
}

export interface RegisterAgentOutput {
  apiKey: string
  claimId: string
  claimUrl: string
  verificationCode: string
}

export async function registerAgent(input: RegisterAgentInput): Promise<RegisterAgentOutput> {
  const { agentName, telegramId, ownerAddress } = input

  // Validate ownerAddress
  if (!ownerAddress || !isAddress(ownerAddress)) {
    throw new RegisterAgentError("Valid Ethereum address required for ownerAddress", 400)
  }

  // Validate agentName
  if (!agentName || !AGENT_NAME_REGEX.test(agentName)) {
    throw new RegisterAgentError(
      "agentName must be 2-64 characters, alphanumeric and underscores only",
      400
    )
  }

  // Validate telegramId (max 128 chars, basic format)
  if (!telegramId || typeof telegramId !== "string" || telegramId.trim().length === 0) {
    throw new RegisterAgentError("telegramId is required", 400)
  }
  if (telegramId.trim().length > 128) {
    throw new RegisterAgentError("telegramId must be 128 characters or fewer", 400)
  }

  const repo = createAgentRegistrationRepository()

  // Generate credentials
  const claimId = randomBytes(32).toString("hex")
  const verificationCode = generateVerificationCode()
  const randomPart = randomBytes(32).toString("hex")
  const apiKey = `${KEY_PREFIX}${randomPart}`
  const apiKeyHash = hashKey(apiKey)
  const apiKeyPrefix = makeKeyPrefix(apiKey)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.zkbasecred.xyz"
  const claimUrl = `${baseUrl}/agent/claim/${claimId}`

  // Atomically claim agent name + store registration (SETNX prevents race conditions)
  const created = await repo.create({
    claimId,
    verificationCode,
    agentName,
    telegramId: telegramId.trim(),
    ownerAddress: ownerAddress.toLowerCase(),
    status: "pending_claim",
    apiKeyHash,
    apiKeyPrefix,
    tweetUrl: null,
    createdAt: Date.now(),
    verifiedAt: null,
    expiresAt: Date.now() + TTL_24H_MS,
  })

  if (!created) {
    throw new RegisterAgentError(
      `Agent name "${agentName}" is already registered`,
      409
    )
  }

  return { apiKey, claimId, claimUrl, verificationCode }
}

export class RegisterAgentError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "RegisterAgentError"
    this.status = status
  }
}
