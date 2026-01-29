/**
 * Fallback Rules
 * 
 * These rules handle cases where signal coverage is insufficient.
 * They are evaluated FIRST, before any other rules.
 */

import type { Rule } from "../../types/rules"

/**
 * Fallback rules for handling incomplete signal data.
 * 
 * Evaluation order:
 * 1. deny_no_signals - No data at all → DENY
 * 2. limit_partial_signals - Less than 50% coverage → ALLOW_WITH_LIMITS
 */
export const FALLBACK_RULES: Rule[] = [
    {
        id: "deny_no_signals",
        context: "*",
        when: (s) => s.signalCoverage === 0,
        decision: "DENY",
        reason: "No reputation signals available",
        confidenceDelta: -100,
    },
    {
        id: "limit_partial_signals",
        context: "*",
        when: (s) => s.signalCoverage < 0.5,
        decision: "ALLOW_WITH_LIMITS",
        reason: "Insufficient signal coverage for full access",
        confidenceDelta: -30,
    },
]
