import type { PolicyDefinition } from "../repositories/policyRepository"
import { computePolicyHash, type PolicyHashInput } from "./hash"

const POLICY_INPUTS_V1: PolicyHashInput[] = [
    {
        context: "allowlist.general",
        normalizationVersion: "v1",
        thresholds: {
            trustMin: "HIGH",
            socialTrustMin: "HIGH",
            builderMin: "EXPERT",
            creatorMin: "EXPERT",
            spamRiskMax: "HIGH",
        },
    },
    {
        context: "comment",
        normalizationVersion: "v1",
        thresholds: {
            trustMin: "NEUTRAL",
            socialTrustMin: "NEUTRAL",
            spamRiskMax: "HIGH",
        },
    },
    {
        context: "publish",
        normalizationVersion: "v1",
        thresholds: {
            trustMin: "HIGH",
            socialTrustMin: "HIGH",
            builderMin: "BUILDER",
            creatorMin: "BUILDER",
            spamRiskMax: "HIGH",
        },
    },
    {
        context: "apply",
        normalizationVersion: "v1",
        thresholds: {
            trustMin: "NEUTRAL",
            builderMin: "EXPERT",
            creatorMin: "EXPERT",
            spamRiskMax: "HIGH",
        },
    },
    {
        context: "governance.vote",
        normalizationVersion: "v1",
        thresholds: {
            trustMin: "HIGH",
            socialTrustMin: "NEUTRAL",
            recencyDaysMax: 30,
            spamRiskMax: "HIGH",
        },
    },
]

export const POLICIES_V1: PolicyDefinition[] = POLICY_INPUTS_V1.map((policy) => ({
    ...policy,
    policyHash: computePolicyHash(policy),
}))
