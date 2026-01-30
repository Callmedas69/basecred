/**
 * Rule Types and DSL Definitions
 * 
 * Rules are the core of the Decision Engine.
 * They are deterministic, auditable, and versioned.
 */

import type { NormalizedSignals } from "./signals"
import type { DecisionContext } from "./decisions"

// ============================================================================
// Decision Types
// ============================================================================

export type Decision = "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS"

// ============================================================================
// Rule Interface (Runtime)
// ============================================================================

/**
 * A rule that can be evaluated at runtime.
 * Rules are evaluated in priority order:
 * 1. Fallback rules (signal coverage)
 * 2. Hard-deny rules
 * 3. Allow rules
 * 4. Allow-with-limits rules
 * 5. Default deny
 */
export interface Rule {
    /** Unique identifier for this rule */
    id: string

    /** 
     * Context where this rule applies.
     * Use "*" for global rules (apply to all contexts)
     */
    context: string | "*" | DecisionContext

    /** 
     * Condition function that determines if this rule matches.
     * Must be a pure function with no side effects.
     */
    when: (signals: NormalizedSignals) => boolean

    /** The decision to return if this rule matches */
    decision: Decision

    /** Human-readable explanation for this decision */
    reason: string

    /** 
     * Adjustment to confidence score.
     * Added to base confidence (50) to compute final confidence.
     */
    confidenceDelta: number
}

// ============================================================================
// DSL Types (JSON Representation)
// ============================================================================

/** Operators supported in DSL conditions */
export type DSLOperator = ">=" | ">" | "==" | "<=" | "<" | "!="

/**
 * A single condition in a DSL rule.
 * All conditions in a rule are combined with implicit AND.
 */
export interface DSLCondition {
    /** Signal name to check (e.g., "trust", "builder") */
    signal: string

    /** Comparison operator */
    operator: DSLOperator

    /** Value to compare against */
    value: string | number
}

/**
 * A rule expressed in the declarative DSL format.
 * This format is:
 * - JSON-serializable
 * - Auditable
 * - Hashable for ZK proofs
 */
export interface DSLRule {
    /** Unique identifier */
    id: string

    /** Version of this rule */
    version: string

    /** Context where this rule applies */
    context: string | DecisionContext

    /** 
     * Conditions to evaluate (implicit AND)
     * For OR logic, create separate rules
     */
    conditions: DSLCondition[]

    /** Logic operator (v1 only supports AND) */
    logic: "AND"

    /** Decision to return if all conditions match */
    decision: Decision

    /** Confidence adjustment */
    confidenceDelta: number

    /** Human-readable reason */
    reason: string
}

// ============================================================================
// Ruleset Types
// ============================================================================

/**
 * Metadata for a versioned ruleset.
 * Used for auditing and ZK verification.
 */
export interface RulesetMetadata {
    /** Ruleset version (e.g., "v1.0.0") */
    version: string

    /** SHA-256 hash of the ruleset for API/audit */
    sha256Hash: string

    /** Poseidon hash for ZK circuits (optional) */
    poseidonHash?: string

    /** Number of rules in this set */
    ruleCount: number

    /** Timestamp when this ruleset was created */
    createdAt: number
}

/**
 * A complete ruleset with metadata
 */
export interface Ruleset {
    metadata: RulesetMetadata
    rules: DSLRule[]
}
