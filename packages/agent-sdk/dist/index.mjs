// src/errors.ts
var BasecredError = class extends Error {
  /** HTTP status code (0 for network errors) */
  status;
  /** Machine-readable error code from the API (e.g. "UNAUTHORIZED") */
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "BasecredError";
    this.status = status;
    this.code = code;
  }
};
var AuthError = class extends BasecredError {
  constructor(message, code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "AuthError";
  }
};
var RateLimitError = class extends BasecredError {
  /** Seconds until the rate limit resets (from Retry-After header) */
  retryAfter;
  constructor(message, retryAfter, code = "RATE_LIMITED") {
    super(message, 429, code);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var ValidationError = class extends BasecredError {
  constructor(message, code = "INVALID_REQUEST") {
    super(message, 400, code);
    this.name = "ValidationError";
  }
};
var NotFoundError = class extends BasecredError {
  constructor(message, code = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
};
var ServiceUnavailableError = class extends BasecredError {
  constructor(message, code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
    this.name = "ServiceUnavailableError";
  }
};
var ServerError = class extends BasecredError {
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message, status, code);
    this.name = "ServerError";
  }
};
var NetworkError = class extends BasecredError {
  constructor(message, cause) {
    super(message, 0, "NETWORK_ERROR");
    this.name = "NetworkError";
    if (cause !== void 0) {
      this.cause = cause;
    }
  }
};
function mapHttpError(status, body, retryAfterHeader) {
  const message = body?.message ?? `HTTP ${status}`;
  const code = body?.code ?? "UNKNOWN";
  switch (status) {
    case 400:
    case 413:
    case 409:
    case 410:
    case 422:
      return new ValidationError(message, code);
    case 401:
      return new AuthError(message, code);
    case 404:
      return new NotFoundError(message, code);
    case 429: {
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      return new RateLimitError(message, isNaN(retryAfter) ? 60 : retryAfter, code);
    }
    case 503:
      return new ServiceUnavailableError(message, code);
    default:
      if (status >= 500) return new ServerError(message, status, code);
      return new BasecredError(message, status, code);
  }
}

// src/http.ts
var DEFAULT_TIMEOUT_MS = 12e4;
var DEFAULT_BASE_URL = "https://www.zkbasecred.xyz";
function encodePathSegment(value, name) {
  if (!value || /[\/\\?#]/.test(value)) {
    throw new ValidationError(
      `Invalid ${name}: must not contain path separators or query characters`
    );
  }
  return encodeURIComponent(value);
}
function createHttpConfig(options) {
  return {
    baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey: options.apiKey,
    fetch: options.fetch ?? globalThis.fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  };
}
async function httpGet(config, path, query) {
  let url = `${config.baseUrl}${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }
  return request(config, url, { method: "GET" });
}
async function httpPost(config, path, body) {
  const url = `${config.baseUrl}${path}`;
  const init = { method: "POST" };
  if (body !== void 0) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return request(config, url, init);
}
async function request(config, url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = new Headers(init.headers);
  if (config.apiKey) {
    headers.set("x-api-key", config.apiKey);
  }
  try {
    const response = await config.fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      let body = null;
      try {
        body = await response.json();
      } catch {
      }
      const retryAfter = response.headers.get("retry-after");
      throw mapHttpError(response.status, body, retryAfter);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new NetworkError("Request timed out", error);
    }
    if (error instanceof BasecredError) {
      throw error;
    }
    throw new NetworkError(
      error instanceof Error ? error.message : "Network request failed",
      error
    );
  }
}

// src/registration.ts
var DEFAULT_POLL_INTERVAL_MS = 5e3;
var DEFAULT_MAX_ATTEMPTS = 720;
var MAX_POLL_RETRIES = 3;
var TERMINAL_STATUSES = /* @__PURE__ */ new Set(["verified", "expired", "revoked"]);
var Registration = class {
  /** The API key — SAVE THIS, it will not be shown again. */
  apiKey;
  /** Unique claim ID used for polling and verification. */
  claimId;
  /** URL the owner visits to verify the claim. */
  claimUrl;
  /** Code the owner must include in their verification tweet. */
  verificationCode;
  /** @internal */
  http;
  constructor(data, http) {
    this.apiKey = data.apiKey;
    this.claimId = data.claimId;
    this.claimUrl = data.claimUrl;
    this.verificationCode = data.verificationCode;
    this.http = http;
  }
  /** Prevents accidental API key exposure when serialized (e.g. logging, JSON.stringify). */
  toJSON() {
    return {
      claimId: this.claimId,
      claimUrl: this.claimUrl,
      verificationCode: this.verificationCode
    };
  }
  /**
   * Async generator that yields RegistrationStatus on each poll.
   * Stops when the status reaches a terminal state (verified, expired, revoked)
   * or when maxAttempts is reached.
   *
   * Network errors during polling are retried up to 3 times before throwing.
   */
  async *poll(options) {
    const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const signal = options?.signal;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal?.aborted) {
        throw new NetworkError("Polling aborted");
      }
      const status = await this.fetchStatusWithRetry(signal);
      yield status;
      if (TERMINAL_STATUSES.has(status.status)) {
        return;
      }
      await this.sleep(intervalMs, signal);
    }
    throw new ValidationError(
      `Polling timed out after ${maxAttempts} attempts`,
      "POLL_TIMEOUT"
    );
  }
  /**
   * Convenience method — resolves when the registration is verified.
   * Rejects if the registration expires, is revoked, or polling times out.
   */
  async waitUntilVerified(options) {
    for await (const status of this.poll(options)) {
      if (status.status === "verified") {
        return status;
      }
      if (status.status === "expired") {
        throw new ValidationError("Registration expired", "EXPIRED");
      }
      if (status.status === "revoked") {
        throw new ValidationError("Registration revoked", "REVOKED");
      }
    }
    throw new ValidationError("Polling ended without terminal status", "POLL_TIMEOUT");
  }
  /**
   * Submit a tweet URL for verification.
   */
  async verify(tweetUrl) {
    return httpPost(
      this.http,
      `/api/v1/agent/register/${encodePathSegment(this.claimId, "claimId")}/verify`,
      { tweetUrl }
    );
  }
  /** Fetch status with retry logic for transient network errors. */
  async fetchStatusWithRetry(signal) {
    let lastError;
    for (let retry = 0; retry <= MAX_POLL_RETRIES; retry++) {
      if (signal?.aborted) {
        throw new NetworkError("Polling aborted");
      }
      try {
        return await httpGet(
          this.http,
          `/api/v1/agent/register/${encodePathSegment(this.claimId, "claimId")}/status`
        );
      } catch (error) {
        lastError = error;
        if (!(error instanceof NetworkError)) {
          throw error;
        }
        if (retry < MAX_POLL_RETRIES) {
          await this.sleep(1e3 * (retry + 1), signal);
        }
      }
    }
    throw lastError;
  }
  /** Sleep that can be interrupted by AbortSignal. */
  sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new NetworkError("Polling aborted"));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new NetworkError("Polling aborted"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
};

// src/client.ts
var BasecredAgent = class {
  http;
  constructor(config) {
    if (!config.apiKey || !config.apiKey.startsWith("bc_")) {
      throw new ValidationError(
        'API key is required and must start with "bc_".'
      );
    }
    this.http = createHttpConfig({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      fetch: config.fetch,
      timeoutMs: config.timeoutMs
    });
  }
  // ─────────────────────────────────────────────────────────────
  // Authenticated endpoints
  // ─────────────────────────────────────────────────────────────
  /**
   * Check the reputation of the wallet that owns this API key.
   * Generates ZK proofs and submits decisions on-chain.
   *
   * This can take up to 90 seconds (ZK proof generation + on-chain submission).
   */
  async checkOwner() {
    return httpPost(this.http, "/api/v1/agent/check-owner");
  }
  // ─────────────────────────────────────────────────────────────
  // Public endpoints (no auth needed, but still uses instance config)
  // ─────────────────────────────────────────────────────────────
  /** List all available decision contexts. */
  async getContexts() {
    const res = await httpGet(this.http, "/api/v1/contexts");
    return res.contexts;
  }
  /** List all policies with their context and policy hash. */
  async getPolicies() {
    const res = await httpGet(this.http, "/api/v1/policies");
    return res.policies;
  }
  /** Get the global activity feed. */
  async getFeed(limit) {
    const query = limit !== void 0 ? { limit: String(limit) } : void 0;
    const res = await httpGet(this.http, "/api/v1/agent/feed", query);
    return res.entries;
  }
  /** Get aggregated protocol statistics. */
  async getStats() {
    const res = await httpGet(this.http, "/api/v1/stats");
    return res.stats;
  }
  // ─────────────────────────────────────────────────────────────
  // Static methods (no API key required)
  // ─────────────────────────────────────────────────────────────
  /**
   * Register a new agent. Returns a Registration object with the API key
   * and methods to poll/verify the claim.
   *
   * **IMPORTANT**: Save the `apiKey` from the returned Registration —
   * it will not be shown again.
   */
  static async register(input, options) {
    if (!input.agentName?.trim()) {
      throw new ValidationError("agentName is required");
    }
    if (!input.ownerAddress?.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError("ownerAddress must be a valid Ethereum address (0x + 40 hex chars)");
    }
    if (!input.telegramId?.trim()) {
      throw new ValidationError("telegramId is required");
    }
    const http = createHttpConfig({
      baseUrl: options?.baseUrl,
      fetch: options?.fetch,
      timeoutMs: options?.timeoutMs
    });
    const response = await httpPost(http, "/api/v1/agent/register", input);
    return new Registration(
      {
        apiKey: response.apiKey,
        claimId: response.claimId,
        claimUrl: response.claimUrl,
        verificationCode: response.verificationCode
      },
      http
    );
  }
  /**
   * Check the status of an existing registration claim.
   */
  static async checkRegistration(claimId, options) {
    const http = createHttpConfig({
      baseUrl: options?.baseUrl,
      fetch: options?.fetch,
      timeoutMs: options?.timeoutMs
    });
    return httpGet(
      http,
      `/api/v1/agent/register/${encodePathSegment(claimId, "claimId")}/status`
    );
  }
};
export {
  AuthError,
  BasecredAgent,
  BasecredError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  Registration,
  ServerError,
  ServiceUnavailableError,
  ValidationError
};
//# sourceMappingURL=index.mjs.map