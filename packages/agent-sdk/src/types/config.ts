/**
 * Configuration for the BasecredAgent client.
 */
export interface BasecredAgentConfig {
  /** API key (starts with "bc_"). Required for authenticated endpoints. */
  apiKey: string
  /** Base URL of the BaseCred API. Defaults to "https://www.zkbasecred.xyz" */
  baseUrl?: string
  /** Custom fetch implementation (useful for testing or polyfills). Defaults to global fetch. */
  fetch?: typeof globalThis.fetch
  /** Default request timeout in milliseconds. Defaults to 120000 (120s). */
  timeoutMs?: number
}

/**
 * Options for public (unauthenticated) static methods that don't need an API key.
 */
export interface PublicRequestOptions {
  /** Base URL of the BaseCred API. Defaults to "https://www.zkbasecred.xyz" */
  baseUrl?: string
  /** Custom fetch implementation. */
  fetch?: typeof globalThis.fetch
  /** Request timeout in milliseconds. */
  timeoutMs?: number
}
