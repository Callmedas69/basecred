import { decide, normalizeSignals } from "basecred-decision-engine";
import { fetchLiveProfile } from "@/repositories/liveProfileRepository";

export type GetDecisionResult = {
    context: string;
    decision: "ALLOW" | "DENY" | "ALLOW_WITH_LIMITS";
    confidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
    explain: string[];
    signals: any;
    profile: any;
};

export async function getDecision(subject: string, context: string): Promise<GetDecisionResult> {
    // 1. Fetch Data
    const profileData = await fetchLiveProfile(subject);

    // 2. Normalize
    const signals = normalizeSignals(profileData);

    // 3. Decide
    const decision = decide(signals, context);

    return {
        context,
        ...decision,
        signals,
        profile: profileData
    };
}
