/**
 * Hard-Deny Rules
 * 
 * These rules identify critical risk factors that warrant immediate denial.
 * They are evaluated AFTER fallback rules but BEFORE allow rules.
 * 
 * First match wins - if any hard-deny rule matches, the decision is DENY.
 */

import type { Rule } from "../../types/rules"

/**
 * Hard-deny rules that fail fast on critical risk signals.
 *
 * These rules apply to ALL contexts (context: "*").
 */
export const HARD_DENY_RULES: Rule[] = [
    {
        id: "deny_spam",
        context: "*",
        when: (s) => s.spamRisk === "HIGH" || s.spamRisk === "VERY_HIGH",
        decision: "DENY",
        reason: "High spam risk detected",
        confidenceDelta: -100,
    },
    {
        id: "deny_low_social_trust",
        context: "*",
        when: (s) => s.socialTrust === "VERY_LOW",
        decision: "DENY",
        reason: "Social trust below acceptable threshold",
        confidenceDelta: -100,
    },
    {
        id: "deny_critical_trust",
        context: "*",
        when: (s) => s.trust === "VERY_LOW",
        decision: "DENY",
        reason: "Critical trust risk detected",
        confidenceDelta: -100,
    },
]
