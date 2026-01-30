import { decide, normalizeSignals } from "basecred-decision-engine";
import { fetchLiveProfile } from "@/repositories/liveProfileRepository";

export type GetDecisionResult = {
    context: string;
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
    confidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
    explain: string[];
    accessStatus?: "eligible" | "limited" | "not_ready" | "blocked";
    blockingFactors?: string[];
    signals: any;
    profile: any;
};

export async function getDecision(subject: string, context: string): Promise<GetDecisionResult> {
    // 1. Fetch Data
    const profileData = await fetchLiveProfile(subject);

    // 2. Normalize
    const signals = normalizeSignals(profileData);

    // 3. Decide
    // Explorer passes context strings that align with engine DecisionContext,
    // but we cast here to avoid over-constraining the UI helper.
    const decision = decide(signals, context as any);

    return {
        context,
        ...decision,
        signals,
        profile: profileData
    };
}
