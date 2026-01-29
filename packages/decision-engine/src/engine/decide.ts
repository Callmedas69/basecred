/**
 * Decision Engine Core
 * 
 * The main decide() function that evaluates rules and produces decisions.
 * This is the heart of the BaseCred Decision Engine.
 * 
 * Architecture:
 * - This module is BUSINESS LOGIC only
 * - It receives NormalizedSignals (from normalizers)
 * - It returns DecisionOutput (for API layer)
 * - It has NO knowledge of HTTP, databases, or external APIs
 */

import type { NormalizedSignals } from "../types/signals"
import type { Rule } from "../types/rules"
import type { DecisionOutput } from "../types/decisions"
import {
    FALLBACK_RULES,
    HARD_DENY_RULES,
    ALLOW_RULES,
    ALLOW_WITH_LIMITS_RULES,
} from "./rules"
import { mapConfidence, BASE_CONFIDENCE } from "./confidence"

// ============================================================================
// Constants
// ============================================================================

/** Current engine version - included in all decision outputs */
export const ENGINE_VERSION = "v1"

// ============================================================================
// Main Decision Function
// ============================================================================

/**
 * Evaluate rules and produce a decision for the given signals and context.
 * 
 * This function implements the 5-phase evaluation order:
 * 1. Fallback rules (signal coverage)
 * 2. Hard-deny rules (critical risks)
 * 3. Allow rules (positive signals)
 * 4. Allow-with-limits rules (conditional access)
 * 5. Default deny (no rule matched)
 * 
 * First match wins - the engine returns immediately when a rule matches.
 * 
 * @param signals - Normalized signals from reputation providers
 * @param context - Decision context (e.g., "allowlist.general")
 * @returns DecisionOutput with decision, confidence, and explanation
 * 
 * @example
 * const decision = decide(signals, "allowlist.general")
 * // { decision: "ALLOW", confidence: "HIGH", ... }
 */
export function decide(
    signals: NormalizedSignals,
    context: string
): DecisionOutput {
    // Phase 1: Fallback rules (signal coverage)
    for (const rule of FALLBACK_RULES) {
        if (matchesContext(rule, context) && rule.when(signals)) {
            return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta)
        }
    }

    // Phase 2: Hard deny (fail fast on critical risks)
    for (const rule of HARD_DENY_RULES) {
        if (matchesContext(rule, context) && rule.when(signals)) {
            return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta)
        }
    }

    // Phase 3: Allow rules (positive signals)
    for (const rule of ALLOW_RULES) {
        if (matchesContext(rule, context) && rule.when(signals)) {
            return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta)
        }
    }

    // Phase 4: Allow with limits (conditional access)
    for (const rule of ALLOW_WITH_LIMITS_RULES) {
        if (matchesContext(rule, context) && rule.when(signals)) {
            return finalize(rule, BASE_CONFIDENCE + rule.confidenceDelta)
        }
    }

    // Phase 5: Default deny (no rule matched)
    return {
        decision: "DENY",
        confidence: "LOW",
        constraints: [],
        retryAfter: null,
        ruleIds: [],
        version: ENGINE_VERSION,
        explain: ["No rule satisfied for this context"],
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a rule applies to the given context.
 * Rules with context "*" apply to all contexts.
 */
function matchesContext(rule: Rule, context: string): boolean {
    return rule.context === "*" || rule.context === context
}

/**
 * Create the final DecisionOutput from a matched rule.
 */
function finalize(rule: Rule, numericConfidence: number): DecisionOutput {
    return {
        decision: rule.decision,
        confidence: mapConfidence(numericConfidence),
        constraints: getConstraintsForRule(rule),
        retryAfter: null,
        ruleIds: [rule.id],
        version: ENGINE_VERSION,
        explain: [rule.reason],
    }
}

/**
 * Get constraints for ALLOW_WITH_LIMITS rules.
 * This can be extended to return specific constraints per rule.
 */
function getConstraintsForRule(rule: Rule): string[] {
    if (rule.decision !== "ALLOW_WITH_LIMITS") {
        return []
    }

    // Map rule IDs to specific constraints
    const constraintMap: Record<string, string[]> = {
        probation_inactive: ["reduced_access", "activity_required"],
        probation_new_user: ["probation_period", "limited_actions"],
        probation_mixed_signals: ["review_required"],
        limit_partial_signals: ["reduced_access"],
        limit_comment_new: ["rate_limited"],
        limit_publish_unverified: ["review_queue"],
        limit_governance_inactive: ["reduced_weight"],
    }

    return constraintMap[rule.id] ?? ["limited_access"]
}

// ============================================================================
// Exports
// ============================================================================

export { mapConfidence, BASE_CONFIDENCE } from "./confidence"
