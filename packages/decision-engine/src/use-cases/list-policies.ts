import type { PolicyDefinition, PolicyRepository } from "../repositories/policyRepository"

export interface ListPoliciesUseCaseDependencies {
    policyRepository: PolicyRepository
}

export async function listPolicies(
    deps: ListPoliciesUseCaseDependencies
): Promise<PolicyDefinition[]> {
    const contexts = [
        "allowlist.general",
        "apply",
        "comment",
        "publish",
        "governance.vote",
    ] as const

    const policies = await Promise.all(
        contexts.map((context) => deps.policyRepository.getPolicyByContext(context))
    )

    return policies.filter((policy): policy is PolicyDefinition => Boolean(policy))
}
