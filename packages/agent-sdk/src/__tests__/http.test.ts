import { describe, it, expect, vi } from "vitest"
import { createHttpConfig, httpGet, httpPost } from "../http"
import { AuthError, NetworkError, RateLimitError } from "../errors"

function mockFetch(response: {
  ok: boolean
  status: number
  json?: () => Promise<unknown>
  headers?: Headers
}) {
  const headers = response.headers ?? new Headers()
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: response.json ?? (() => Promise.resolve({})),
    headers,
  }) as unknown as typeof globalThis.fetch
}

describe("createHttpConfig", () => {
  it("uses defaults when no options provided", () => {
    const config = createHttpConfig({})
    expect(config.baseUrl).toBe("https://www.zkbasecred.xyz")
    expect(config.timeoutMs).toBe(120_000)
    expect(config.apiKey).toBeUndefined()
  })

  it("strips trailing slashes from baseUrl", () => {
    const config = createHttpConfig({ baseUrl: "https://example.com///" })
    expect(config.baseUrl).toBe("https://example.com")
  })

  it("uses custom values", () => {
    const f = mockFetch({ ok: true, status: 200 })
    const config = createHttpConfig({
      baseUrl: "https://custom.xyz",
      apiKey: "bc_test",
      fetch: f,
      timeoutMs: 5000,
    })
    expect(config.baseUrl).toBe("https://custom.xyz")
    expect(config.apiKey).toBe("bc_test")
    expect(config.timeoutMs).toBe(5000)
  })
})

describe("httpGet", () => {
  it("sends GET request and parses JSON", async () => {
    const data = { contexts: ["comment", "publish"] }
    const f = mockFetch({ ok: true, status: 200, json: () => Promise.resolve(data) })
    const config = createHttpConfig({ fetch: f })

    const result = await httpGet(config, "/api/v1/contexts")
    expect(result).toEqual(data)
    expect(f).toHaveBeenCalledTimes(1)

    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/contexts")
    expect(init.method).toBe("GET")
  })

  it("appends query parameters", async () => {
    const f = mockFetch({ ok: true, status: 200, json: () => Promise.resolve({}) })
    const config = createHttpConfig({ fetch: f })

    await httpGet(config, "/api/v1/agent/feed", { limit: "10" })
    const [url] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/feed?limit=10")
  })

  it("sends x-api-key header when configured", async () => {
    const f = mockFetch({ ok: true, status: 200, json: () => Promise.resolve({}) })
    const config = createHttpConfig({ fetch: f, apiKey: "bc_secret" })

    await httpGet(config, "/test")
    const [, init] = f.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get("x-api-key")).toBe("bc_secret")
  })

  it("throws AuthError on 401", async () => {
    const f = mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: "UNAUTHORIZED", message: "bad key" }),
    })
    const config = createHttpConfig({ fetch: f })

    await expect(httpGet(config, "/test")).rejects.toBeInstanceOf(AuthError)
  })

  it("throws RateLimitError on 429 with Retry-After", async () => {
    const headers = new Headers({ "retry-after": "30" })
    const f = mockFetch({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ code: "RATE_LIMITED", message: "slow" }),
      headers,
    })
    const config = createHttpConfig({ fetch: f })

    try {
      await httpGet(config, "/test")
      expect.fail("should throw")
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError)
      expect((err as RateLimitError).retryAfter).toBe(30)
    }
  })

  it("handles non-JSON error response", async () => {
    const f = mockFetch({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })
    const config = createHttpConfig({ fetch: f })

    await expect(httpGet(config, "/test")).rejects.toThrow("HTTP 500")
  })
})

describe("httpPost", () => {
  it("sends POST with JSON body", async () => {
    const f = mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) })
    const config = createHttpConfig({ fetch: f })

    const result = await httpPost(config, "/api/v1/agent/register", { agentName: "test" })
    expect(result).toEqual({ ok: true })

    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://www.zkbasecred.xyz/api/v1/agent/register")
    expect(init.method).toBe("POST")

    // Verify Content-Type is set in the merged headers
    const headers = init.headers as Headers
    expect(headers.get("content-type")).toBe("application/json")
  })

  it("sends POST without body", async () => {
    const f = mockFetch({ ok: true, status: 200, json: () => Promise.resolve({}) })
    const config = createHttpConfig({ fetch: f })

    await httpPost(config, "/api/v1/agent/check-owner")
    const [, init] = f.mock.calls[0]
    expect(init.method).toBe("POST")
  })
})

describe("network errors", () => {
  it("wraps fetch rejection as NetworkError", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("fetch failed")) as unknown as typeof globalThis.fetch
    const config = createHttpConfig({ fetch: f })

    await expect(httpGet(config, "/test")).rejects.toBeInstanceOf(NetworkError)
  })

  it("wraps abort as NetworkError with timeout message", async () => {
    // Simulate a fetch that takes too long
    const f = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"))
          })
        }),
    ) as unknown as typeof globalThis.fetch

    const config = createHttpConfig({ fetch: f, timeoutMs: 50 })

    try {
      await httpGet(config, "/test")
      expect.fail("should throw")
    } catch (err) {
      expect(err).toBeInstanceOf(NetworkError)
      expect((err as NetworkError).message).toBe("Request timed out")
    }
  })
})
