import type { DecisionContext } from "../types/decisions"
import type { PolicyDefinition, PolicyRepository } from "./policyRepository"
import { POLICIES_V1 } from "../policies/v1"

export class InMemoryPolicyRepository implements PolicyRepository {
    private readonly policies: Map<DecisionContext, PolicyDefinition>

    constructor(policies: PolicyDefinition[] = POLICIES_V1) {
        this.policies = new Map(policies.map((policy) => [policy.context, policy]))
    }

    async getPolicyByContext(context: DecisionContext): Promise<PolicyDefinition | null> {
        return this.policies.get(context) ?? null
    }
}
