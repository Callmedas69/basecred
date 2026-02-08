import { describe, it, expect } from "vitest"
import { GET } from "../app/api/v1/policies/route"


describe("/api/v1/policies", () => {
    it("returns policy hashes", async () => {
        const res = await GET()
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data.policies)).toBe(true)
        expect(data.policies.length).toBeGreaterThan(0)
        expect(data.policies[0]).toHaveProperty("context")
        expect(data.policies[0]).toHaveProperty("policyHash")
    })
})
