/**
 * BasecredAgent — Main SDK client class.
 *
 * Authenticated methods require an API key (starts with "bc_").
 * Public/static methods work without authentication.
 */

import { createHttpConfig, encodePathSegment, httpGet, httpPost, type HttpClientConfig } from "./http"
import { Registration } from "./registration"
import { ValidationError } from "./errors"
import type { BasecredAgentConfig, PublicRequestOptions } from "./types/config"
import type {
  RegisterAgentInput,
  RegistrationStatus,
} from "./types/registration"
import type { ReputationResult } from "./types/reputation"
import type {
  ContextInfo,
  PolicyInfo,
  FeedEntry,
  ProtocolStats,
} from "./types/contexts"

export class BasecredAgent {
  private readonly http: HttpClientConfig

  constructor(config: BasecredAgentConfig) {
    if (!config.apiKey || !config.apiKey.startsWith("bc_")) {
      throw new ValidationError(
        'API key is required and must start with "bc_".',
      )
    }

    this.http = createHttpConfig({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      fetch: config.fetch,
      timeoutMs: config.timeoutMs,
    })
  }

  // ─────────────────────────────────────────────────────────────
  // Authenticated endpoints
  // ─────────────────────────────────────────────────────────────

  /**
   * Check the reputation of the wallet that owns this API key.
   * Generates ZK proofs and submits decisions on-chain.
   *
   * This can take up to 90 seconds (ZK proof generation + on-chain submission).
   */
  async checkOwner(): Promise<ReputationResult> {
    return httpPost<ReputationResult>(this.http, "/api/v1/agent/check-owner")
  }

  // ─────────────────────────────────────────────────────────────
  // Public endpoints (no auth needed, but still uses instance config)
  // ─────────────────────────────────────────────────────────────

  /** List all available decision contexts. */
  async getContexts(): Promise<ContextInfo[]> {
    const res = await httpGet<{ contexts: ContextInfo[] }>(this.http, "/api/v1/contexts")
    return res.contexts
  }

  /** List all policies with their context and policy hash. */
  async getPolicies(): Promise<PolicyInfo[]> {
    const res = await httpGet<{ policies: PolicyInfo[] }>(this.http, "/api/v1/policies")
    return res.policies
  }

  /** Get the global activity feed. */
  async getFeed(limit?: number): Promise<FeedEntry[]> {
    const query = limit !== undefined ? { limit: String(limit) } : undefined
    const res = await httpGet<{ entries: FeedEntry[] }>(this.http, "/api/v1/agent/feed", query)
    return res.entries
  }

  /** Get aggregated protocol statistics. */
  async getStats(): Promise<ProtocolStats> {
    const res = await httpGet<{ stats: ProtocolStats }>(this.http, "/api/v1/stats")
    return res.stats
  }

  // ─────────────────────────────────────────────────────────────
  // Static methods (no API key required)
  // ─────────────────────────────────────────────────────────────

  /**
   * Register a new agent. Returns a Registration object with the API key
   * and methods to poll/verify the claim.
   *
   * **IMPORTANT**: Save the `apiKey` from the returned Registration —
   * it will not be shown again.
   */
  static async register(
    input: RegisterAgentInput,
    options?: PublicRequestOptions,
  ): Promise<Registration> {
    if (!input.agentName?.trim()) {
      throw new ValidationError("agentName is required")
    }
    if (!input.ownerAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError("ownerAddress must be a valid Ethereum address (0x + 40 hex chars)")
    }
    if (!input.telegramId?.trim()) {
      throw new ValidationError("telegramId is required")
    }

    const http = createHttpConfig({
      baseUrl: options?.baseUrl,
      fetch: options?.fetch,
      timeoutMs: options?.timeoutMs,
    })

    const response = await httpPost<{
      apiKey: string
      claimId: string
      claimUrl: string
      verificationCode: string
      message: string
    }>(http, "/api/v1/agent/register", input)

    return new Registration(
      {
        apiKey: response.apiKey,
        claimId: response.claimId,
        claimUrl: response.claimUrl,
        verificationCode: response.verificationCode,
      },
      http,
    )
  }

  /**
   * Check the status of an existing registration claim.
   */
  static async checkRegistration(
    claimId: string,
    options?: PublicRequestOptions,
  ): Promise<RegistrationStatus> {
    const http = createHttpConfig({
      baseUrl: options?.baseUrl,
      fetch: options?.fetch,
      timeoutMs: options?.timeoutMs,
    })

    return httpGet<RegistrationStatus>(
      http,
      `/api/v1/agent/register/${encodePathSegment(claimId, "claimId")}/status`,
    )
  }
}
