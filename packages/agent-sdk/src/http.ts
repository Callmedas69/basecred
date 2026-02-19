/**
 * HTTP transport layer for the BaseCred Agent SDK.
 *
 * Thin wrapper around fetch that handles:
 * - API key header injection
 * - Configurable timeout via AbortController
 * - JSON parsing and typed error mapping
 */

import { BasecredError, mapHttpError, NetworkError, ValidationError } from "./errors"

const DEFAULT_TIMEOUT_MS = 120_000
const DEFAULT_BASE_URL = "https://www.zkbasecred.xyz"

/**
 * Validate and encode a value for safe use in a URL path segment.
 * Prevents path traversal and query/fragment injection.
 */
export function encodePathSegment(value: string, name: string): string {
  if (!value || /[\/\\?#]/.test(value)) {
    throw new ValidationError(
      `Invalid ${name}: must not contain path separators or query characters`,
    )
  }
  return encodeURIComponent(value)
}

export interface HttpClientConfig {
  baseUrl: string
  apiKey?: string
  fetch: typeof globalThis.fetch
  timeoutMs: number
}

export function createHttpConfig(options: {
  baseUrl?: string
  apiKey?: string
  fetch?: typeof globalThis.fetch
  timeoutMs?: number
}): HttpClientConfig {
  return {
    baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey: options.apiKey,
    fetch: options.fetch ?? globalThis.fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  }
}

export async function httpGet<T>(
  config: HttpClientConfig,
  path: string,
  query?: Record<string, string>,
): Promise<T> {
  let url = `${config.baseUrl}${path}`
  if (query) {
    const params = new URLSearchParams(query)
    url += `?${params.toString()}`
  }
  return request<T>(config, url, { method: "GET" })
}

export async function httpPost<T>(
  config: HttpClientConfig,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${config.baseUrl}${path}`
  const init: RequestInit = { method: "POST" }
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" }
    init.body = JSON.stringify(body)
  }
  return request<T>(config, url, init)
}

async function request<T>(
  config: HttpClientConfig,
  url: string,
  init: RequestInit,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  // Merge headers: auth + any existing headers
  const headers = new Headers(init.headers)
  if (config.apiKey) {
    headers.set("x-api-key", config.apiKey)
  }

  try {
    const response = await config.fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      let body: { code?: string; message?: string } | null = null
      try {
        body = await response.json()
      } catch {
        // Non-JSON error response — leave body null
      }
      const retryAfter = response.headers.get("retry-after")
      throw mapHttpError(response.status, body, retryAfter)
    }

    return (await response.json()) as T
  } catch (error) {
    clearTimeout(timeout)

    // AbortController timeout — check before SDK errors since DOMException can match "code" check
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timed out", error)
    }

    // Re-throw SDK errors as-is
    if (error instanceof BasecredError) {
      throw error
    }

    // Generic network failure
    throw new NetworkError(
      error instanceof Error ? error.message : "Network request failed",
      error,
    )
  }
}
