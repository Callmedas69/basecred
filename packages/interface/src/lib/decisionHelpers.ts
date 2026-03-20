import type { DecisionContext, NormalizedSignals } from "basecred-decision-engine"

/**
 * Derive constraints for the ZK proof path.
 *
 * The ZK circuit doesn't return rule IDs, so we derive constraints
 * from the decision + context, mirroring the decision engine rules.
 */
export function deriveConstraintsForContext(
    decision: string,
    context: string
): string[] {
    if (decision !== "ALLOW_WITH_LIMITS") return []

    const constraintMap: Record<string, string[]> = {
        "allowlist.general": ["reduced_access"],
        comment: ["rate_limited"],
        publish: ["review_queue"],
        "governance.vote": ["reduced_weight"],
        apply: ["review_required"],
    }
    return constraintMap[context] ?? ["limited_access"]
}

/**
 * Build human-readable explanation for the decision.
 */
export function buildExplanation(
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS",
    signals: NormalizedSignals,
    context: DecisionContext
): string[] {
    const reasons: string[] = []

    reasons.push(`Trust level: ${signals.trust}`)
    reasons.push(`Social trust: ${signals.socialTrust}`)
    reasons.push(`Builder capability: ${signals.builder}`)
    reasons.push(`Creator capability: ${signals.creator}`)

    if (signals.spamRisk !== "NEUTRAL") {
        reasons.push(`Spam risk: ${signals.spamRisk}`)
    }

    if (signals.recencyDays > 0) {
        reasons.push(`Last activity: ${signals.recencyDays} days ago`)
    }

    reasons.push(`Signal coverage: ${Math.round(signals.signalCoverage * 100)}%`)

    if (decision === "ALLOW") {
        reasons.push(`Eligible for ${context} based on reputation signals.`)
    } else if (decision === "ALLOW_WITH_LIMITS") {
        reasons.push(`Limited access to ${context} - some criteria not fully met.`)
    } else {
        if (signals.signalCoverage < 0.5) {
            reasons.push("Insufficient signal coverage to make a confident decision.")
        } else if (signals.spamRisk === "HIGH" || signals.spamRisk === "VERY_HIGH") {
            reasons.push("High spam risk detected.")
        } else if (signals.trust === "VERY_LOW") {
            reasons.push("Trust level is too low for this context.")
        } else if (signals.socialTrust === "VERY_LOW" || signals.socialTrust === "LOW") {
            reasons.push("Social trust is below required threshold.")
        } else {
            reasons.push(`Requirements for ${context} not met.`)
        }
    }

    return reasons
}
