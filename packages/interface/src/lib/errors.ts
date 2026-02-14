/**
 * Typed Application Errors
 *
 * Error classes with HTTP status codes for clean error-to-response mapping.
 * Replaces string-based substring matching with typed instanceof checks.
 */

export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = "AppError"
    this.status = status
    this.code = code
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 503, "CONFIG_ERROR")
    this.name = "ConfigError"
  }
}

export class ContractRevertError extends AppError {
  constructor(message: string) {
    super(message, 422, "CONTRACT_REVERT")
    this.name = "ContractRevertError"
  }
}

/**
 * Extract the real revert reason from a viem error chain.
 *
 * Viem maps RPC error code -32000 to "Missing or invalid parameters" which
 * hides the actual contract revert reason. This walks the error chain to
 * find the real message from the RPC response (e.g. "Invalid proof",
 * "Policy hash mismatch", etc).
 */
export function extractRevertReason(err: unknown): string {
  if (!(err instanceof Error)) return String(err)

  // Try to use viem's BaseError.walk() if available
  if ("walk" in err && typeof (err as any).walk === "function") {
    const inner = (err as any).walk()
    if (inner && inner !== err) {
      if ("details" in inner && typeof inner.details === "string" && inner.details.length > 0) {
        return inner.details
      }
      if ("data" in inner && typeof inner.data === "string" && inner.data.startsWith("0x")) {
        return `revert data: ${inner.data}`
      }
    }
  }

  // Shallow fallback for non-BaseError viem errors
  const cause = (err as any).cause
  if (cause?.details) return cause.details
  if (cause?.reason) return cause.reason

  return (err as any).shortMessage || err.message
}

/**
 * Maps an unknown error to an AppError with the appropriate status code.
 * Use this in API catch blocks instead of substring matching.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const message = extractRevertReason(error)

  // Check if this looks like a contract revert
  const viemError = error as { shortMessage?: string; cause?: { reason?: string } }
  if (
    viemError?.shortMessage?.includes("revert") ||
    viemError?.cause?.reason ||
    message.startsWith("revert data:")
  ) {
    return new ContractRevertError(message)
  }

  return new AppError(message, 500, "INTERNAL_ERROR")
}
