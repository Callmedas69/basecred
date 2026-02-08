import { describe, it, expect, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "../app/api/v1/agent/decide/route"
import { InMemoryPolicyRepository } from "basecred-decision-engine"

const policyRepository = new InMemoryPolicyRepository()

function buildRequest(body: unknown) {
    return new NextRequest("http://localhost/api/v1/agent/decide", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
    })
}

describe("/api/v1/agent/decide", () => {
    beforeEach(() => {
        process.env.ZK_ALLOW_PLAINTEXT_SIGNALS = "true"
        process.env.NODE_ENV = "test"
    })

    it("returns decision for plaintext signals", async () => {
        const policy = await policyRepository.getPolicyByContext("allowlist.general")

        const req = buildRequest({
            context: "allowlist.general",
            proof: { proof: "dev" },
            publicInputs: {
                policyHash: policy!.policyHash,
                signals: {
                    trust: "HIGH",
                    socialTrust: "HIGH",
                    builder: "EXPERT",
                    creator: "EXPERT",
                    recencyDays: 10,
                    spamRisk: "NEUTRAL",
                    signalCoverage: 1,
                },
            },
        })

        const res = await POST(req)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.decision).toBe("ALLOW")
        expect(data.policyHash).toBe(policy!.policyHash)
    })

    it("rejects missing policy hash", async () => {
        const req = buildRequest({
            context: "comment",
            proof: { proof: "dev" },
            publicInputs: {
                signals: {
                    trust: "HIGH",
                    socialTrust: "HIGH",
                    builder: "EXPERT",
                    creator: "EXPERT",
                    recencyDays: 10,
                    spamRisk: "NEUTRAL",
                    signalCoverage: 1,
                },
            },
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.code).toBe("INVALID_REQUEST")
    })

    it("rejects invalid context", async () => {
        const req = buildRequest({
            context: "invalid.context",
            proof: { proof: "dev" },
            publicInputs: {
                policyHash: "sha256:invalid",
                signals: {
                    trust: "HIGH",
                    socialTrust: "HIGH",
                    builder: "EXPERT",
                    creator: "EXPERT",
                    recencyDays: 10,
                    spamRisk: "NEUTRAL",
                    signalCoverage: 1,
                },
            },
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.code).toBe("INVALID_REQUEST")
    })
})
