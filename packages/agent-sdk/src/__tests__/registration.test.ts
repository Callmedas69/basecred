import { describe, it, expect, vi } from "vitest"
import { Registration } from "../registration"
import { createHttpConfig } from "../http"
import { AuthError, NetworkError, ValidationError } from "../errors"

function mockFetchSequence(responses: Array<{ ok: boolean; status: number; body: unknown; headers?: Headers }>) {
  let callIndex = 0
  return vi.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? responses[responses.length - 1]
    callIndex++
    return Promise.resolve({
      ok: resp.ok,
      status: resp.status,
      json: () => Promise.resolve(resp.body),
      headers: resp.headers ?? new Headers(),
    })
  }) as unknown as typeof globalThis.fetch
}

function createRegistration(fetchFn: typeof globalThis.fetch) {
  const http = createHttpConfig({ fetch: fetchFn })
  return new Registration(
    {
      apiKey: "bc_test123",
      claimId: "claim_abc",
      claimUrl: "https://www.zkbasecred.xyz/claim/claim_abc",
      verificationCode: "VERIFY_XYZ",
    },
    http,
  )
}

describe("Registration properties", () => {
  it("exposes readonly properties from constructor data", () => {
    const f = vi.fn() as unknown as typeof globalThis.fetch
    const reg = createRegistration(f)

    expect(reg.apiKey).toBe("bc_test123")
    expect(reg.claimId).toBe("claim_abc")
    expect(reg.claimUrl).toBe("https://www.zkbasecred.xyz/claim/claim_abc")
    expect(reg.verificationCode).toBe("VERIFY_XYZ")
  })
})

describe("Registration.poll", () => {
  it("yields status updates until terminal state", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "pending_claim", agentName: "Bot" } },
      { ok: true, status: 200, body: { status: "pending_claim", agentName: "Bot" } },
      { ok: true, status: 200, body: { status: "verified", agentName: "Bot" } },
    ])

    const reg = createRegistration(f)
    const statuses: string[] = []

    for await (const status of reg.poll({ intervalMs: 10 })) {
      statuses.push(status.status)
    }

    expect(statuses).toEqual(["pending_claim", "pending_claim", "verified"])
  })

  it("stops on expired status", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "expired" } },
    ])

    const reg = createRegistration(f)
    const statuses: string[] = []

    for await (const status of reg.poll({ intervalMs: 10 })) {
      statuses.push(status.status)
    }

    expect(statuses).toEqual(["expired"])
  })

  it("throws on maxAttempts exceeded", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "pending_claim" } },
    ])

    const reg = createRegistration(f)

    await expect(async () => {
      for await (const _status of reg.poll({ intervalMs: 10, maxAttempts: 2 })) {
        // consume
      }
    }).rejects.toThrow(ValidationError)
  })

  it("respects AbortSignal", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "pending_claim" } },
    ])

    const reg = createRegistration(f)
    const controller = new AbortController()

    // Abort after the first yield
    let count = 0
    await expect(async () => {
      for await (const _status of reg.poll({ intervalMs: 10, signal: controller.signal })) {
        count++
        if (count >= 1) controller.abort()
      }
    }).rejects.toThrow(NetworkError)
  })
})

describe("Registration.waitUntilVerified", () => {
  it("resolves when status is verified", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "pending_claim" } },
      { ok: true, status: 200, body: { status: "verified", agentName: "Bot" } },
    ])

    const reg = createRegistration(f)
    const result = await reg.waitUntilVerified({ intervalMs: 10 })
    expect(result.status).toBe("verified")
  })

  it("rejects when status is expired", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "expired" } },
    ])

    const reg = createRegistration(f)
    await expect(reg.waitUntilVerified({ intervalMs: 10 })).rejects.toThrow("expired")
  })

  it("rejects when status is revoked", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { status: "revoked" } },
    ])

    const reg = createRegistration(f)
    await expect(reg.waitUntilVerified({ intervalMs: 10 })).rejects.toThrow("revoked")
  })
})

describe("Registration.verify", () => {
  it("sends POST with tweetUrl body", async () => {
    const f = mockFetchSequence([
      { ok: true, status: 200, body: { success: true } },
    ])

    const reg = createRegistration(f)
    const result = await reg.verify("https://x.com/user/status/123")
    expect(result).toEqual({ success: true })

    const [url, init] = (f as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/register/claim_abc/verify")
    expect(init.method).toBe("POST")
  })
})

describe("Registration.toJSON", () => {
  it("omits apiKey to prevent accidental serialization", () => {
    const f = vi.fn() as unknown as typeof globalThis.fetch
    const reg = createRegistration(f)
    const json = JSON.parse(JSON.stringify(reg))

    expect(json.apiKey).toBeUndefined()
    expect(json.claimId).toBe("claim_abc")
    expect(json.claimUrl).toBe("https://www.zkbasecred.xyz/claim/claim_abc")
    expect(json.verificationCode).toBe("VERIFY_XYZ")
  })
})

describe("Registration polling retry logic", () => {
  it("retries on transient NetworkError then succeeds", async () => {
    let callCount = 0
    const f = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount <= 2) {
        return Promise.reject(new TypeError("fetch failed"))
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: "verified", agentName: "Bot" }),
        headers: new Headers(),
      })
    }) as unknown as typeof globalThis.fetch

    const reg = createRegistration(f)
    const statuses: string[] = []

    for await (const status of reg.poll({ intervalMs: 10 })) {
      statuses.push(status.status)
    }

    expect(statuses).toEqual(["verified"])
    // 2 failed + 1 success = 3 calls minimum
    expect(callCount).toBeGreaterThanOrEqual(3)
  })

  it("does not retry non-NetworkError (e.g. AuthError)", async () => {
    const f = mockFetchSequence([
      { ok: false, status: 401, body: { code: "UNAUTHORIZED", message: "bad key" } },
    ])

    const reg = createRegistration(f)

    await expect(async () => {
      for await (const _status of reg.poll({ intervalMs: 10 })) {
        // consume
      }
    }).rejects.toBeInstanceOf(AuthError)

    // Should NOT have retried — only 1 call
    expect((f as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
  })
})
