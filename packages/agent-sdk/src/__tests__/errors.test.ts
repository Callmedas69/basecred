import { describe, it, expect } from "vitest"
import {
  BasecredError,
  AuthError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  ServerError,
  NetworkError,
  mapHttpError,
} from "../errors"

describe("Error classes", () => {
  it("BasecredError carries status and code", () => {
    const err = new BasecredError("test", 418, "TEAPOT")
    expect(err.message).toBe("test")
    expect(err.status).toBe(418)
    expect(err.code).toBe("TEAPOT")
    expect(err.name).toBe("BasecredError")
    expect(err instanceof Error).toBe(true)
  })

  it("AuthError defaults to 401", () => {
    const err = new AuthError("bad key")
    expect(err.status).toBe(401)
    expect(err.code).toBe("UNAUTHORIZED")
    expect(err.name).toBe("AuthError")
    expect(err instanceof BasecredError).toBe(true)
  })

  it("RateLimitError includes retryAfter", () => {
    const err = new RateLimitError("slow down", 30)
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(30)
    expect(err.name).toBe("RateLimitError")
  })

  it("NetworkError has status 0 and stores cause", () => {
    const cause = new TypeError("fetch failed")
    const err = new NetworkError("gone", cause)
    expect(err.status).toBe(0)
    expect(err.code).toBe("NETWORK_ERROR")
    expect(err.cause).toBe(cause)
  })
})

describe("mapHttpError", () => {
  it("maps 400 to ValidationError", () => {
    const err = mapHttpError(400, { code: "INVALID_REQUEST", message: "bad" })
    expect(err).toBeInstanceOf(ValidationError)
    expect(err.message).toBe("bad")
  })

  it("maps 401 to AuthError", () => {
    const err = mapHttpError(401, { code: "UNAUTHORIZED", message: "no key" })
    expect(err).toBeInstanceOf(AuthError)
  })

  it("maps 404 to NotFoundError", () => {
    const err = mapHttpError(404, { code: "NOT_FOUND", message: "missing" })
    expect(err).toBeInstanceOf(NotFoundError)
  })

  it("maps 429 to RateLimitError with Retry-After header", () => {
    const err = mapHttpError(429, { message: "slow" }, "45")
    expect(err).toBeInstanceOf(RateLimitError)
    expect((err as RateLimitError).retryAfter).toBe(45)
  })

  it("maps 429 defaults retryAfter to 60 when header is missing", () => {
    const err = mapHttpError(429, { message: "slow" }, null)
    expect((err as RateLimitError).retryAfter).toBe(60)
  })

  it("maps 503 to ServiceUnavailableError", () => {
    const err = mapHttpError(503, { message: "down" })
    expect(err).toBeInstanceOf(ServiceUnavailableError)
  })

  it("maps 500 to ServerError", () => {
    const err = mapHttpError(500, { message: "boom" })
    expect(err).toBeInstanceOf(ServerError)
    expect(err.status).toBe(500)
  })

  it("maps 502 to ServerError", () => {
    const err = mapHttpError(502, { message: "gateway" })
    expect(err).toBeInstanceOf(ServerError)
    expect(err.status).toBe(502)
  })

  it("maps 413 to ValidationError", () => {
    const err = mapHttpError(413, { code: "PAYLOAD_TOO_LARGE", message: "big" })
    expect(err).toBeInstanceOf(ValidationError)
  })

  it("maps 409 to ValidationError", () => {
    const err = mapHttpError(409, { message: "conflict" })
    expect(err).toBeInstanceOf(ValidationError)
  })

  it("maps 422 to ValidationError", () => {
    const err = mapHttpError(422, { message: "unprocessable" })
    expect(err).toBeInstanceOf(ValidationError)
  })

  it("falls back to BasecredError for unknown status", () => {
    const err = mapHttpError(418, { message: "teapot" })
    expect(err).toBeInstanceOf(BasecredError)
    expect(err.status).toBe(418)
  })

  it("handles null body gracefully", () => {
    const err = mapHttpError(500, null)
    expect(err).toBeInstanceOf(ServerError)
    expect(err.message).toBe("HTTP 500")
    expect(err.code).toBe("UNKNOWN")
  })
})
