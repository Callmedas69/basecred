/**
 * Rule Registry
 * 
 * Central export point for all rule sets.
 * Rules are organized by type and evaluation order.
 */

export { FALLBACK_RULES } from "./fallback"
export { HARD_DENY_RULES } from "./hard-deny"
export { ALLOW_RULES } from "./allow"
export { ALLOW_WITH_LIMITS_RULES } from "./allow-with-limits"

// ============================================================================
// All Rules Combined (for introspection)
// ============================================================================

import { FALLBACK_RULES } from "./fallback"
import { HARD_DENY_RULES } from "./hard-deny"
import { ALLOW_RULES } from "./allow"
import { ALLOW_WITH_LIMITS_RULES } from "./allow-with-limits"
import type { Rule } from "../../types/rules"

/**
 * All rules in evaluation order.
 * Useful for introspection, testing, and documentation.
 */
export const ALL_RULES: Rule[] = [
    ...FALLBACK_RULES,
    ...HARD_DENY_RULES,
    ...ALLOW_RULES,
    ...ALLOW_WITH_LIMITS_RULES,
]

/**
 * Get all rules for a specific context.
 */
export function getRulesForContext(context: string): Rule[] {
    return ALL_RULES.filter(
        (rule) => rule.context === "*" || rule.context === context
    )
}

/**
 * Get rule by ID.
 */
export function getRuleById(id: string): Rule | undefined {
    return ALL_RULES.find((rule) => rule.id === id)
}

/**
 * Get all unique contexts.
 */
export function getAllContexts(): string[] {
    const contexts = new Set<string>()
    for (const rule of ALL_RULES) {
        if (rule.context !== "*") {
            contexts.add(rule.context)
        }
    }
    return Array.from(contexts)
}
