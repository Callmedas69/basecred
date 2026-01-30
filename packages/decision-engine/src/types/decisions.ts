/**
 * Decision Output Types
 * 
 * These types define the structure of decision responses
 * from the Decision Engine.
 */

import type { Decision } from "./rules"

// ============================================================================
// Confidence Types
// ============================================================================

/**
 * Categorical confidence tier for API responses.
 * Mapped from numeric confidence (base 50 + deltas).
 */
export type ConfidenceTier = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"

/**
 * Retail-facing access status derived from the authoritative decision.
 *
 * This is a global, non-decisional interpretation layer and MUST NOT
 * be used to change engine behavior or thresholds.
 */
export type AccessStatus =
    | "eligible"   // ALLOW
    | "limited"    // ALLOW_WITH_LIMITS
    | "not_ready"  // DENY but fixable
    | "blocked"    // Hard deny / irrecoverable

// ============================================================================
// Decision Output
// ============================================================================

/**
 * Machine-readable decision output from the engine.
 * This is the primary response format for the /v1/decide API.
 */
export interface DecisionOutput {
    /** The actual decision: ALLOW, DENY, or ALLOW_WITH_LIMITS */
    decision: Decision

    /** Confidence level in this decision */
    confidence: ConfidenceTier

    /** 
     * Constraints applied when decision is ALLOW_WITH_LIMITS.
     * Empty array for ALLOW or DENY.
     */
    constraints: string[]

    /** 
     * Seconds to wait before retrying (for rate-limited or temporary denials).
     * null if not applicable.
     */
    retryAfter: number | null

    /** IDs of rules that contributed to this decision */
    ruleIds: string[]

    /** Engine version used for this decision */
    version: string

    /** Human-readable explanation of the decision */
    explain: string[]

    /**
     * Derived, retail-facing access status.
     *
     * This field is OPTIONAL and is populated by the progression layer.
     * It does not affect enforcement or core decision semantics.
     */
    accessStatus?: AccessStatus

    /**
     * Context-aware factors currently blocking access.
     *
     * This is a high-level, fixable guidance list and MUST NOT expose
     * raw scores or implementation details.
     */
    blockingFactors?: string[]
}

/**
 * Human-readable explanation format.
 * Optional enhancement to DecisionOutput.
 */
export interface DecisionExplanation {
    /** One-line summary */
    summary: string

    /** Detailed breakdown of factors */
    factors: string[]
}

// ============================================================================
// Decision Logging
// ============================================================================

/**
 * Decision log entry for auditing.
 * Does NOT include raw scores or signals (data minimization).
 */
export interface DecisionLog {
    /** Hashed identity (for privacy) */
    subjectHash: string

    /** Context where decision was made */
    context: string

    /** The decision that was made */
    decision: Decision

    /** Confidence tier */
    confidence: ConfidenceTier

    /** Rule IDs that matched */
    ruleIds: string[]

    /** Signal coverage at decision time (for debugging) */
    signalCoverage: number

    /** Unix timestamp */
    timestamp: number
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * All valid contexts where the decision engine can be invoked.
 * Centralizing this ensures we don't have "magic strings" scattered around.
 */
export type DecisionContext = 
    | "allowlist.general" // Main allowlist check
    | "apply"             // Job/Grant applications
    | "comment"           // Commenting permissions
    | "publish"           // Publishing content
    | "governance.vote"   // Voting rights

/**
 * Helper to check if a string is a valid context at runtime
 */
export const VALID_CONTEXTS: DecisionContext[] = [
    "allowlist.general",
    "apply",
    "comment",
    "publish",
    "governance.vote"
]

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for POST /v1/decide
 */
export interface DecideRequest {
    /** Wallet address or Farcaster FID */
    subject: string

    /** Decision context (e.g., "allowlist.general") */
    context: DecisionContext
}

/**
 * Error response format
 */
export interface DecisionError {
    /** Error code */
    code: string

    /** Human-readable error message */
    message: string

    /** Additional details (optional) */
    details?: Record<string, unknown>
}
