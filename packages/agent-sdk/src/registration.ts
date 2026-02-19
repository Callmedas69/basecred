/**
 * Registration — Handles the agent registration lifecycle.
 *
 * After calling BasecredAgent.register(), you get a Registration object
 * with the API key, claim URL, and methods to poll status or verify.
 */

import { encodePathSegment, httpGet, httpPost, type HttpClientConfig } from "./http"
import { NetworkError, ValidationError } from "./errors"
import type { RegistrationStatus, PollOptions } from "./types/registration"

const DEFAULT_POLL_INTERVAL_MS = 5_000
const DEFAULT_MAX_ATTEMPTS = 720 // ~1 hour at 5s intervals
const MAX_POLL_RETRIES = 3

/** Terminal status values that stop polling */
const TERMINAL_STATUSES = new Set(["verified", "expired", "revoked"])

export class Registration {
  /** The API key — SAVE THIS, it will not be shown again. */
  readonly apiKey: string
  /** Unique claim ID used for polling and verification. */
  readonly claimId: string
  /** URL the owner visits to verify the claim. */
  readonly claimUrl: string
  /** Code the owner must include in their verification tweet. */
  readonly verificationCode: string

  /** @internal */
  private readonly http: HttpClientConfig

  constructor(
    data: {
      apiKey: string
      claimId: string
      claimUrl: string
      verificationCode: string
    },
    http: HttpClientConfig,
  ) {
    this.apiKey = data.apiKey
    this.claimId = data.claimId
    this.claimUrl = data.claimUrl
    this.verificationCode = data.verificationCode
    this.http = http
  }

  /** Prevents accidental API key exposure when serialized (e.g. logging, JSON.stringify). */
  toJSON() {
    return {
      claimId: this.claimId,
      claimUrl: this.claimUrl,
      verificationCode: this.verificationCode,
    }
  }

  /**
   * Async generator that yields RegistrationStatus on each poll.
   * Stops when the status reaches a terminal state (verified, expired, revoked)
   * or when maxAttempts is reached.
   *
   * Network errors during polling are retried up to 3 times before throwing.
   */
  async *poll(options?: PollOptions): AsyncGenerator<RegistrationStatus> {
    const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    const signal = options?.signal

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal?.aborted) {
        throw new NetworkError("Polling aborted")
      }

      const status = await this.fetchStatusWithRetry(signal)
      yield status

      if (TERMINAL_STATUSES.has(status.status)) {
        return
      }

      // Wait before next poll (interruptible via AbortSignal)
      await this.sleep(intervalMs, signal)
    }

    throw new ValidationError(
      `Polling timed out after ${maxAttempts} attempts`,
      "POLL_TIMEOUT",
    )
  }

  /**
   * Convenience method — resolves when the registration is verified.
   * Rejects if the registration expires, is revoked, or polling times out.
   */
  async waitUntilVerified(options?: PollOptions): Promise<RegistrationStatus> {
    for await (const status of this.poll(options)) {
      if (status.status === "verified") {
        return status
      }
      if (status.status === "expired") {
        throw new ValidationError("Registration expired", "EXPIRED")
      }
      if (status.status === "revoked") {
        throw new ValidationError("Registration revoked", "REVOKED")
      }
    }

    // Should not reach here — poll() throws on timeout
    throw new ValidationError("Polling ended without terminal status", "POLL_TIMEOUT")
  }

  /**
   * Submit a tweet URL for verification.
   */
  async verify(tweetUrl: string): Promise<{ success: boolean }> {
    return httpPost<{ success: boolean }>(
      this.http,
      `/api/v1/agent/register/${encodePathSegment(this.claimId, "claimId")}/verify`,
      { tweetUrl },
    )
  }

  /** Fetch status with retry logic for transient network errors. */
  private async fetchStatusWithRetry(signal?: AbortSignal): Promise<RegistrationStatus> {
    let lastError: unknown

    for (let retry = 0; retry <= MAX_POLL_RETRIES; retry++) {
      if (signal?.aborted) {
        throw new NetworkError("Polling aborted")
      }

      try {
        return await httpGet<RegistrationStatus>(
          this.http,
          `/api/v1/agent/register/${encodePathSegment(this.claimId, "claimId")}/status`,
        )
      } catch (error) {
        lastError = error
        // Only retry network errors, not API errors
        if (!(error instanceof NetworkError)) {
          throw error
        }
        if (retry < MAX_POLL_RETRIES) {
          await this.sleep(1000 * (retry + 1), signal)
        }
      }
    }

    throw lastError
  }

  /** Sleep that can be interrupted by AbortSignal. */
  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new NetworkError("Polling aborted"))
        return
      }

      const onAbort = () => {
        clearTimeout(timer)
        reject(new NetworkError("Polling aborted"))
      }

      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort)
        resolve()
      }, ms)

      signal?.addEventListener("abort", onAbort, { once: true })
    })
  }
}
