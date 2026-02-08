import { NextResponse } from "next/server"
import { InMemoryPolicyRepository, listPolicies } from "basecred-decision-engine"

const policyRepository = new InMemoryPolicyRepository()

export async function GET() {
    try {
        const policies = await listPolicies({ policyRepository })

        return NextResponse.json({
            policies: policies.map((policy) => ({
                context: policy.context,
                policyHash: policy.policyHash,
                normalizationVersion: policy.normalizationVersion,
            })),
        })
    } catch (error: any) {
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: error.message || "Unknown error" },
            { status: 500 }
        )
    }
}
