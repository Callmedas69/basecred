/**
 * Error hierarchy for the BaseCred Agent SDK.
 *
 * All errors extend BasecredError, which carries the original HTTP status
 * and error code from the API response body.
 */

export class BasecredError extends Error {
  /** HTTP status code (0 for network errors) */
  readonly status: number
  /** Machine-readable error code from the API (e.g. "UNAUTHORIZED") */
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = "BasecredError"
    this.status = status
    this.code = code
  }
}

/** 401 — Invalid or missing API key */
export class AuthError extends BasecredError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(message, 401, code)
    this.name = "AuthError"
  }
}

/** 429 — Rate limit exceeded */
export class RateLimitError extends BasecredError {
  /** Seconds until the rate limit resets (from Retry-After header) */
  readonly retryAfter: number

  constructor(message: string, retryAfter: number, code = "RATE_LIMITED") {
    super(message, 429, code)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
}

/** 400 — Bad request parameters */
export class ValidationError extends BasecredError {
  constructor(message: string, code = "INVALID_REQUEST") {
    super(message, 400, code)
    this.name = "ValidationError"
  }
}

/** 404 — Resource not found */
export class NotFoundError extends BasecredError {
  constructor(message: string, code = "NOT_FOUND") {
    super(message, 404, code)
    this.name = "NotFoundError"
  }
}

/** 503 — Service temporarily unavailable (circuit files, Redis, etc.) */
export class ServiceUnavailableError extends BasecredError {
  constructor(message: string, code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code)
    this.name = "ServiceUnavailableError"
  }
}

/** 5xx — Unexpected server error */
export class ServerError extends BasecredError {
  constructor(message: string, status = 500, code = "INTERNAL_ERROR") {
    super(message, status, code)
    this.name = "ServerError"
  }
}

/** Network failure — fetch rejected, DNS error, timeout, etc. */
export class NetworkError extends BasecredError {
  constructor(message: string, cause?: unknown) {
    super(message, 0, "NETWORK_ERROR")
    this.name = "NetworkError"
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

/**
 * Map an HTTP response status + parsed JSON body to a typed SDK error.
 */
export function mapHttpError(
  status: number,
  body: { code?: string; message?: string } | null,
  retryAfterHeader?: string | null,
): BasecredError {
  const message = body?.message ?? `HTTP ${status}`
  const code = body?.code ?? "UNKNOWN"

  switch (status) {
    case 400:
    case 413:
    case 409:
    case 410:
    case 422:
      return new ValidationError(message, code)
    case 401:
      return new AuthError(message, code)
    case 404:
      return new NotFoundError(message, code)
    case 429: {
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60
      return new RateLimitError(message, isNaN(retryAfter) ? 60 : retryAfter, code)
    }
    case 503:
      return new ServiceUnavailableError(message, code)
    default:
      if (status >= 500) return new ServerError(message, status, code)
      return new BasecredError(message, status, code)
  }
}
