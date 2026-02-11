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
 * Maps an unknown error to an AppError with the appropriate status code.
 * Use this in API catch blocks instead of substring matching.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const message = error instanceof Error ? error.message : "Unknown error"

  // Viem wraps revert reasons
  const viemError = error as { shortMessage?: string; cause?: { reason?: string } }
  if (viemError?.shortMessage?.includes("revert") || viemError?.cause?.reason) {
    return new ContractRevertError(viemError.cause?.reason || viemError.shortMessage || message)
  }

  return new AppError(message, 500, "INTERNAL_ERROR")
}
