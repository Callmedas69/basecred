import { NextRequest, NextResponse } from "next/server"
import { InMemoryPolicyRepository, listPolicies } from "basecred-decision-engine"
import { checkRateLimit } from "@/lib/rateLimit"

const policyRepository = new InMemoryPolicyRepository()

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        const rateCheck = await checkRateLimit("stats", ip)
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
                { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter ?? 60) } }
            )
        }

        const policies = await listPolicies({ policyRepository })

        return NextResponse.json({
            policies: policies.map((policy) => ({
                context: policy.context,
                policyHash: policy.policyHash,
                normalizationVersion: policy.normalizationVersion,
            })),
        })
    } catch (error: unknown) {
        console.error("Policy error:", error)
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
