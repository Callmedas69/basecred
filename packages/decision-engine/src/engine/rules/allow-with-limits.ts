/**
 * Allow-With-Limits Rules
 * 
 * These rules grant conditional access with constraints.
 * They are evaluated AFTER allow rules but BEFORE default deny.
 * 
 * Used for probationary access, rate limits, or users who don't
 * meet full allow criteria but aren't risky enough to deny.
 */

import type { Rule } from "../../types/rules"
import { tierGte } from "../../types/tiers"

/**
 * Rules that grant access with limitations or constraints.
 */
export const ALLOW_WITH_LIMITS_RULES: Rule[] = [
    // =========================================================================
    // Context: allowlist.general
    // =========================================================================
    {
        id: "probation_inactive",
        context: "allowlist.general",
        when: (s) =>
            tierGte(s.trust, "NEUTRAL") && s.recencyDays > 14,
        decision: "ALLOW_WITH_LIMITS",
        reason: "Trustworthy but recently inactive - limited access granted",
        confidenceDelta: -10,
    },
    {
        id: "probation_new_user",
        context: "allowlist.general",
        when: (s) =>
            tierGte(s.trust, "NEUTRAL") &&
            tierGte(s.socialTrust, "NEUTRAL") &&
            s.builder === "EXPLORER" &&
            s.creator === "EXPLORER",
        decision: "ALLOW_WITH_LIMITS",
        reason: "New user with baseline trust - starting at medium confidence",
        confidenceDelta: 0,
    },
    {
        id: "probation_mixed_signals",
        context: "allowlist.general",
        when: (s) =>
            tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "LOW"),
        decision: "ALLOW_WITH_LIMITS",
        reason: "High ability but mixed social signals - limited access",
        confidenceDelta: -10,
    },

    // =========================================================================
    // Context: comment
    // =========================================================================
    {
        id: "limit_comment_new",
        context: "comment",
        when: (s) =>
            tierGte(s.trust, "LOW") && s.signalCoverage >= 0.5,
        decision: "ALLOW_WITH_LIMITS",
        reason: "New user - rate-limited commenting allowed",
        confidenceDelta: -5,
    },

    // =========================================================================
    // Context: publish
    // =========================================================================
    {
        id: "limit_publish_unverified",
        context: "publish",
        when: (s) =>
            tierGte(s.trust, "NEUTRAL") &&
            tierGte(s.socialTrust, "NEUTRAL"),
        decision: "ALLOW_WITH_LIMITS",
        reason: "Baseline trust - publishing with review queue",
        confidenceDelta: -10,
    },

    // =========================================================================
    // Context: governance.vote
    // =========================================================================
    {
        id: "limit_governance_inactive",
        context: "governance.vote",
        when: (s) =>
            tierGte(s.trust, "HIGH") && s.recencyDays > 30 && s.recencyDays <= 90,
        decision: "ALLOW_WITH_LIMITS",
        reason: "Trusted but inactive - reduced voting weight",
        confidenceDelta: -15,
    },
]
