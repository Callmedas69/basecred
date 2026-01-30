/**
 * Allow Rules
 * 
 * These rules identify positive signals that warrant granting access.
 * They are evaluated AFTER fallback and hard-deny rules.
 * 
 * Rules are context-specific - they only match for their declared context.
 */

import type { Rule } from "../../types/rules"
import { tierGte, capabilityGte } from "../../types/tiers"

/**
 * Allowlist rules for granting full access.
 * 
 * These rules match specific contexts and positive reputation signals.
 */
export const ALLOW_RULES: Rule[] = [
    // =========================================================================
    // Context: allowlist.general
    // =========================================================================
    {
        id: "allow_strong_builder",
        context: "allowlist.general",
        when: (s) =>
            s.builder === "ELITE" ||
            (capabilityGte(s.builder, "EXPERT") && tierGte(s.socialTrust, "HIGH")),
        decision: "ALLOW",
        reason: "Strong builder credibility with sufficient social trust",
        confidenceDelta: +30,
    },
    {
        id: "allow_strong_creator",
        context: "allowlist.general",
        when: (s) =>
            s.creator === "ELITE" ||
            (capabilityGte(s.creator, "EXPERT") && tierGte(s.socialTrust, "HIGH")),
        decision: "ALLOW",
        reason: "Strong creator credibility with sufficient social trust",
        confidenceDelta: +30,
    },
    {
        id: "allow_high_trust",
        context: "allowlist.general",
        when: (s) =>
            tierGte(s.trust, "HIGH") && tierGte(s.socialTrust, "HIGH"),
        decision: "ALLOW",
        reason: "High trust across multiple reputation systems",
        confidenceDelta: +25,
    },

    // =========================================================================
    // Context: comment
    // =========================================================================
    {
        id: "allow_comment_trusted",
        context: "comment",
        when: (s) =>
            tierGte(s.trust, "NEUTRAL") && tierGte(s.socialTrust, "NEUTRAL"),
        decision: "ALLOW",
        reason: "Sufficient trust for commenting",
        confidenceDelta: +15,
    },

    // =========================================================================
    // Context: publish
    // =========================================================================
    {
        id: "allow_publish_verified",
        context: "publish",
        when: (s) =>
            tierGte(s.trust, "HIGH") &&
            tierGte(s.socialTrust, "HIGH") &&
            (capabilityGte(s.builder, "BUILDER") || capabilityGte(s.creator, "BUILDER")),
        decision: "ALLOW",
        reason: "Verified publisher with demonstrated capability",
        confidenceDelta: +25,
    },

    // =========================================================================
    // Context: apply (job applications, grants, etc.)
    // =========================================================================
    {
        id: "allow_apply_qualified",
        context: "apply",
        when: (s) =>
            tierGte(s.trust, "NEUTRAL") &&
            (capabilityGte(s.builder, "EXPERT") || capabilityGte(s.creator, "EXPERT")),
        decision: "ALLOW",
        reason: "Qualified applicant with demonstrated skills",
        confidenceDelta: +20,
    },

    // =========================================================================
    // Context: governance.vote
    // =========================================================================
    {
        id: "allow_governance_vote",
        context: "governance.vote",
        when: (s) =>
            tierGte(s.trust, "HIGH") &&
            tierGte(s.socialTrust, "NEUTRAL") &&
            s.recencyDays <= 30,
        decision: "ALLOW",
        reason: "Active, trusted member eligible for governance",
        confidenceDelta: +20,
    },
]
