import type { DecisionContext } from "../types/decisions"

export interface PolicyDefinition {
    context: DecisionContext
    policyHash: string
    normalizationVersion: string
    thresholds: Record<string, string | number>
}

export interface PolicyRepository {
    getPolicyByContext(context: DecisionContext): Promise<PolicyDefinition | null>
}
