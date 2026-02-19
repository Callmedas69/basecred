/**
 * Types for the agent registration flow.
 */

/** Input for BasecredAgent.register() */
export interface RegisterAgentInput {
  /** Display name for the agent */
  agentName: string
  /** Owner's Telegram handle (e.g. "@mybot") */
  telegramId: string
  /** Owner's Ethereum wallet address (0x...) */
  ownerAddress: string
  /** Optional webhook URL for event notifications */
  webhookUrl?: string
}

/** Raw response from POST /api/v1/agent/register */
export interface RegisterAgentResponse {
  /** The API key — SAVE THIS, it will not be shown again */
  apiKey: string
  /** Unique claim ID for polling status */
  claimId: string
  /** URL the owner visits to verify the claim */
  claimUrl: string
  /** Code the owner must include in their verification tweet */
  verificationCode: string
  /** Human-readable instruction message */
  message: string
}

/** Status of a registration claim */
export type RegistrationStatusValue = "pending_claim" | "verified" | "expired" | "revoked"

/** Response from GET /api/v1/agent/register/[claimId]/status */
export interface RegistrationStatus {
  status: RegistrationStatusValue
  agentName?: string
  verificationCode?: string
  ownerAddress?: string
  expiresAt?: number
}

/** Options for polling registration status */
export interface PollOptions {
  /** Polling interval in milliseconds. Default: 5000 (5s) */
  intervalMs?: number
  /** Maximum number of poll attempts. Default: 720 (~1 hour at 5s interval) */
  maxAttempts?: number
  /** AbortSignal for cancellation */
  signal?: AbortSignal
}
