/**
 * Progression & Explainability Layer
 *
 * This module provides a non-decisional, retail-facing interpretation of
 * authoritative engine outputs. It MUST NOT change rule thresholds, ordering,
 * or core decision behavior.
 */

import type { NormalizedSignals } from "../types/signals"
import type { AccessStatus, DecisionContext } from "../types/decisions"
import type { Decision } from "../types/rules"

// ============================================================================
// Access Status Mapping
// ============================================================================

/**
 * Options for deriving access status from a decision.
 */
export interface AccessStatusOptions {
    /**
     * Indicates that the decision came from a hard-deny rule.
     * When true, DENY decisions are mapped to "blocked" instead of "not_ready".
     */
    isHardDeny?: boolean
}

/**
 * Derive a retail-facing access status from an authoritative decision.
 *
 * This mapping is global and context-agnostic. It is applied AFTER the engine
 * has produced its decision and does not affect enforcement.
 */
export function deriveAccessStatus(
    decision: Decision,
    options: AccessStatusOptions = {}
): AccessStatus {
    if (decision === "ALLOW") {
        return "eligible"
    }

    if (decision === "ALLOW_WITH_LIMITS") {
        return "limited"
    }

    // decision === "DENY"
    if (options.isHardDeny) {
        return "blocked"
    }

    return "not_ready"
}

// ============================================================================
// Blocking Factors (Global Snapshot)
// ============================================================================

/**
 * Snapshot of high-level readiness factors.
 *
 * This intentionally avoids exposing raw scores or tiers. Instead it reports
 * whether a factor is currently in a "ready" state for access progression.
 */
export interface BlockingFactorSnapshot {
    trust: boolean
    socialTrust: boolean
    builder: boolean
    creator: boolean
    spamRisk: boolean
    signalCoverage: boolean
}

/**
 * Resolve global blocking-factor readiness from normalized signals.
 *
 * This function does NOT apply thresholds for decisions. It only reports
 * whether each factor is currently considered ready (true) or blocking (false)
 * at a coarse level suitable for UX.
 */
export function resolveBlockingFactors(
    signals: NormalizedSignals
): BlockingFactorSnapshot {
    return {
        // Trust is considered ready when not at the very bottom tier
        trust: signals.trust !== "VERY_LOW",

        // Social trust is ready when not below NEUTRAL
        socialTrust: signals.socialTrust !== "VERY_LOW",

        // Builder/creator considered ready from mid-tier upwards
        builder: signals.builder !== "EXPLORER",
        creator: signals.creator !== "EXPLORER",

        // Spam risk is acceptable when not in the top risk tiers
        spamRisk: signals.spamRisk !== "VERY_HIGH" && signals.spamRisk !== "HIGH",

        // Signal coverage is considered ready when we have most signals
        signalCoverage: signals.signalCoverage >= 0.8,
    }
}

// ============================================================================
// Context Requirements
// ============================================================================

/**
 * Context-specific factor requirements.
 *
 * This defines which high-level factors matter for each context. It is used
 * purely for explanation and progression and does not affect the rule engine.
 */
export const CONTEXT_REQUIREMENTS: Record<DecisionContext, (keyof BlockingFactorSnapshot)[]> = {
    "allowlist.general": ["trust", "builder", "creator"],
    apply: ["trust"],
    comment: ["spamRisk", "socialTrust"],
    publish: ["creator", "spamRisk"],
    "governance.vote": ["trust", "socialTrust"],
}

// ============================================================================
// Context-Aware Blocking Factors
// ============================================================================

/**
 * Derive a list of context-aware blocking factors from a global snapshot.
 *
 * Only factors that:
 * - are required for the given context, and
 * - are currently not ready
 * will be returned.
 */
export function deriveBlockingFactorsForContext(
    context: DecisionContext,
    snapshot: BlockingFactorSnapshot
): string[] {
    const requiredFactors = CONTEXT_REQUIREMENTS[context] ?? []

    const blocking: string[] = []

    for (const factor of requiredFactors) {
        if (!snapshot[factor]) {
            blocking.push(factor)
        }
    }

    return blocking
}

