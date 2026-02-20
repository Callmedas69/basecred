import { describe, it, expect, vi } from "vitest"
import { BasecredAgent } from "../client"
import { ValidationError } from "../errors"

/** Helper to create a mock fetch that returns a given response body */
function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  }) as unknown as typeof globalThis.fetch
}

describe("BasecredAgent constructor", () => {
  it("rejects empty API key", () => {
    expect(() => new BasecredAgent({ apiKey: "" })).toThrow(ValidationError)
  })

  it("rejects API key without bc_ prefix", () => {
    expect(() => new BasecredAgent({ apiKey: "invalid_key" })).toThrow(ValidationError)
  })

  it("accepts valid API key", () => {
    const f = mockFetchOk({})
    expect(() => new BasecredAgent({ apiKey: "bc_test123", fetch: f })).not.toThrow()
  })
})

describe("BasecredAgent.checkOwner", () => {
  it("calls POST /api/v1/agent/check-owner with API key header", async () => {
    const result = {
      ownerAddress: "0xabc",
      agentName: "TestBot",
      zkEnabled: true,
      summary: "Your reputation is strong.",
      signals: {
        trust: "HIGH",
        socialTrust: "HIGH",
        builder: "EXPERT",
        creator: "BUILDER",
        recencyDays: 5,
        spamRisk: "LOW",
        signalCoverage: 1,
      },
      results: {
        comment: {
          decision: "ALLOW",
          confidence: "HIGH",
          constraints: [],
        },
      },
    }

    const f = mockFetchOk(result)
    const agent = new BasecredAgent({ apiKey: "bc_test", fetch: f })

    const res = await agent.checkOwner()
    expect(res).toEqual(result)

    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/check-owner")
    expect(init.method).toBe("POST")
    const headers = init.headers as Headers
    expect(headers.get("x-api-key")).toBe("bc_test")
  })
})

describe("BasecredAgent.getContexts", () => {
  it("returns contexts array from wrapped response", async () => {
    const f = mockFetchOk({ contexts: ["comment", "publish", "apply"] })
    const agent = new BasecredAgent({ apiKey: "bc_test", fetch: f })

    const contexts = await agent.getContexts()
    expect(contexts).toEqual(["comment", "publish", "apply"])
  })
})

describe("BasecredAgent.getPolicies", () => {
  it("returns policies array from wrapped response", async () => {
    const policies = [
      { context: "comment", policyHash: "0xabc", normalizationVersion: 1 },
    ]
    const f = mockFetchOk({ policies })
    const agent = new BasecredAgent({ apiKey: "bc_test", fetch: f })

    const result = await agent.getPolicies()
    expect(result).toEqual(policies)
  })
})

describe("BasecredAgent.getFeed", () => {
  it("returns feed entries from wrapped response", async () => {
    const entries = [
      { agentName: "Bot", ownerAddress: "0x...", context: "comment", timestamp: 123 },
    ]
    const f = mockFetchOk({ entries })
    const agent = new BasecredAgent({ apiKey: "bc_test", fetch: f })

    const result = await agent.getFeed()
    expect(result).toEqual(entries)

    const [url] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/feed")
  })
})

describe("BasecredAgent.getStats", () => {
  it("returns stats from wrapped response", async () => {
    const stats = {
      totalDecisions: 100,
      uniqueAgents: 5,
      uniqueSubjects: 20,
      decisionsByOutcome: [],
      decisionsByContext: [],
      lastUpdated: "2025-01-01T00:00:00Z",
    }
    const f = mockFetchOk({ stats })
    const agent = new BasecredAgent({ apiKey: "bc_test", fetch: f })

    const result = await agent.getStats()
    expect(result).toEqual(stats)
  })
})

describe("BasecredAgent.register (static)", () => {
  const validInput = {
    agentName: "MyBot",
    telegramId: "@mybot",
    ownerAddress: "0x168D8b4f50BB3aA67D05a6937B643004257118ED",
  }

  it("calls POST /api/v1/agent/register and returns Registration", async () => {
    const registerResponse = {
      apiKey: "bc_newkey123",
      claimId: "abc123def456",
      claimUrl: "https://www.zkbasecred.xyz/claim/abc123def456",
      verificationCode: "VERIFY_CODE",
      message: "SAVE YOUR API KEY!",
    }
    const f = mockFetchOk(registerResponse)

    const registration = await BasecredAgent.register(validInput, { fetch: f })

    expect(registration.apiKey).toBe("bc_newkey123")
    expect(registration.claimId).toBe("abc123def456")
    expect(registration.claimUrl).toBe("https://www.zkbasecred.xyz/claim/abc123def456")
    expect(registration.verificationCode).toBe("VERIFY_CODE")

    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/register")
    expect(init.method).toBe("POST")
  })

  it("rejects empty agentName", async () => {
    await expect(
      BasecredAgent.register({ ...validInput, agentName: "" }),
    ).rejects.toThrow(ValidationError)
  })

  it("rejects invalid ownerAddress", async () => {
    await expect(
      BasecredAgent.register({ ...validInput, ownerAddress: "0x123" }),
    ).rejects.toThrow(ValidationError)
  })

  it("rejects empty telegramId", async () => {
    await expect(
      BasecredAgent.register({ ...validInput, telegramId: "" }),
    ).rejects.toThrow(ValidationError)
  })
})

describe("BasecredAgent.checkRegistration (static)", () => {
  it("calls GET status endpoint", async () => {
    const status = { status: "pending_claim", agentName: "Bot" }
    const f = mockFetchOk(status)

    const result = await BasecredAgent.checkRegistration("abc123", { fetch: f })
    expect(result).toEqual(status)

    const [url] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/register/abc123/status")
  })
})
