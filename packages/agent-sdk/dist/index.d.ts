interface HttpClientConfig {
    baseUrl: string;
    apiKey?: string;
    fetch: typeof globalThis.fetch;
    timeoutMs: number;
}

/**
 * Types for the agent registration flow.
 */
/** Input for BasecredAgent.register() */
interface RegisterAgentInput {
    /** Display name for the agent */
    agentName: string;
    /** Owner's Telegram handle (e.g. "@mybot") */
    telegramId: string;
    /** Owner's Ethereum wallet address (0x...) */
    ownerAddress: string;
    /** Optional webhook URL for event notifications */
    webhookUrl?: string;
}
/** Raw response from POST /api/v1/agent/register */
interface RegisterAgentResponse {
    /** The API key — SAVE THIS, it will not be shown again */
    apiKey: string;
    /** Unique claim ID for polling status */
    claimId: string;
    /** URL the owner visits to verify the claim */
    claimUrl: string;
    /** Code the owner must include in their verification tweet */
    verificationCode: string;
    /** Human-readable instruction message */
    message: string;
}
/** Status of a registration claim */
type RegistrationStatusValue = "pending_claim" | "verified" | "expired" | "revoked";
/** Response from GET /api/v1/agent/register/[claimId]/status */
interface RegistrationStatus {
    status: RegistrationStatusValue;
    agentName?: string;
    verificationCode?: string;
    ownerAddress?: string;
    expiresAt?: number;
}
/** Options for polling registration status */
interface PollOptions {
    /** Polling interval in milliseconds. Default: 5000 (5s) */
    intervalMs?: number;
    /** Maximum number of poll attempts. Default: 720 (~1 hour at 5s interval) */
    maxAttempts?: number;
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
}

/**
 * Registration — Handles the agent registration lifecycle.
 *
 * After calling BasecredAgent.register(), you get a Registration object
 * with the API key, claim URL, and methods to poll status or verify.
 */

declare class Registration {
    /** The API key — SAVE THIS, it will not be shown again. */
    readonly apiKey: string;
    /** Unique claim ID used for polling and verification. */
    readonly claimId: string;
    /** URL the owner visits to verify the claim. */
    readonly claimUrl: string;
    /** Code the owner must include in their verification tweet. */
    readonly verificationCode: string;
    /** @internal */
    private readonly http;
    constructor(data: {
        apiKey: string;
        claimId: string;
        claimUrl: string;
        verificationCode: string;
    }, http: HttpClientConfig);
    /** Prevents accidental API key exposure when serialized (e.g. logging, JSON.stringify). */
    toJSON(): {
        claimId: string;
        claimUrl: string;
        verificationCode: string;
    };
    /**
     * Async generator that yields RegistrationStatus on each poll.
     * Stops when the status reaches a terminal state (verified, expired, revoked)
     * or when maxAttempts is reached.
     *
     * Network errors during polling are retried up to 3 times before throwing.
     */
    poll(options?: PollOptions): AsyncGenerator<RegistrationStatus>;
    /**
     * Convenience method — resolves when the registration is verified.
     * Rejects if the registration expires, is revoked, or polling times out.
     */
    waitUntilVerified(options?: PollOptions): Promise<RegistrationStatus>;
    /**
     * Submit a tweet URL for verification.
     */
    verify(tweetUrl: string): Promise<{
        success: boolean;
    }>;
    /** Fetch status with retry logic for transient network errors. */
    private fetchStatusWithRetry;
    /** Sleep that can be interrupted by AbortSignal. */
    private sleep;
}

/**
 * Configuration for the BasecredAgent client.
 */
interface BasecredAgentConfig {
    /** API key (starts with "bc_"). Required for authenticated endpoints. */
    apiKey: string;
    /** Base URL of the BaseCred API. Defaults to "https://www.zkbasecred.xyz" */
    baseUrl?: string;
    /** Custom fetch implementation (useful for testing or polyfills). Defaults to global fetch. */
    fetch?: typeof globalThis.fetch;
    /** Default request timeout in milliseconds. Defaults to 120000 (120s). */
    timeoutMs?: number;
}
/**
 * Options for public (unauthenticated) static methods that don't need an API key.
 */
interface PublicRequestOptions {
    /** Base URL of the BaseCred API. Defaults to "https://www.zkbasecred.xyz" */
    baseUrl?: string;
    /** Custom fetch implementation. */
    fetch?: typeof globalThis.fetch;
    /** Request timeout in milliseconds. */
    timeoutMs?: number;
}

/**
 * Types for reputation check results.
 * Mirrors CheckOwnerReputationOutput from the API.
 */
/** Trust tier values from the decision engine */
type Tier = "VERY_HIGH" | "HIGH" | "MODERATE" | "NEUTRAL" | "LOW" | "VERY_LOW";
/** Builder/Creator capability values */
type Capability = "EXPERT" | "PROFICIENT" | "INTERMEDIATE" | "MODERATE" | "EXPLORER";
/** Normalized reputation signals from external providers */
interface NormalizedSignals {
    /** Aggregated long-term trust (from Ethos) */
    trust: Tier;
    /** Social legitimacy (from Neynar/Farcaster) */
    socialTrust: Tier;
    /** Technical credibility (from Talent Protocol) */
    builder: Capability;
    /** Content/community credibility (from Talent Protocol) */
    creator: Capability;
    /** Days since last on-chain activity */
    recencyDays: number;
    /** Spam risk indicator (from Neynar) */
    spamRisk: Tier;
    /** Percentage of signals successfully fetched (0-1) */
    signalCoverage: number;
}
/** ZK proof strings for on-chain verification */
interface ContractProofStrings {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
}
/** On-chain submission status for a single context */
interface OnChainStatus {
    submitted: boolean;
    txHash?: string;
    error?: string;
}
/** Decision result for a single context */
interface ContextResult {
    decision: string;
    confidence: string;
    constraints: string[];
    blockingFactors?: string[];
    verified?: boolean;
    proof?: ContractProofStrings;
    publicSignals?: [string, string, string];
    policyHash?: string;
    contextId?: number;
    onChain?: OnChainStatus;
}
/** Full reputation check result */
interface ReputationResult {
    ownerAddress: string;
    agentName: string;
    zkEnabled: boolean;
    summary: string;
    signals: NormalizedSignals;
    results: Record<string, ContextResult>;
}

/**
 * Types for public protocol endpoints (contexts, policies, feed, stats).
 */
/** A decision context (e.g. "allowlist.general", "comment", "publish") */
type ContextInfo = string;
/** Policy info for a context */
interface PolicyInfo {
    context: string;
    policyHash: string;
    normalizationVersion: number;
}
/** An entry in the global activity feed */
interface FeedEntry {
    agentName: string;
    ownerAddress: string;
    context: string;
    txHash?: string;
    timestamp: number;
}
/** Outcome breakdown in protocol stats */
interface OutcomeBreakdown {
    /** 0=DENY, 1=ALLOW_WITH_LIMITS, 2=ALLOW */
    outcome: number;
    label: string;
    count: number;
}
/** Context breakdown in protocol stats */
interface ContextBreakdown {
    contextId: number;
    label: string;
    count: number;
}
/** Aggregated protocol statistics */
interface ProtocolStats {
    totalDecisions: number;
    uniqueAgents: number;
    uniqueSubjects: number;
    decisionsByOutcome: OutcomeBreakdown[];
    decisionsByContext: ContextBreakdown[];
    lastUpdated: string;
}

/**
 * BasecredAgent — Main SDK client class.
 *
 * Authenticated methods require an API key (starts with "bc_").
 * Public/static methods work without authentication.
 */

declare class BasecredAgent {
    private readonly http;
    constructor(config: BasecredAgentConfig);
    /**
     * Check the reputation of the wallet that owns this API key.
     * Generates ZK proofs and submits decisions on-chain.
     *
     * This can take up to 90 seconds (ZK proof generation + on-chain submission).
     */
    checkOwner(): Promise<ReputationResult>;
    /** List all available decision contexts. */
    getContexts(): Promise<ContextInfo[]>;
    /** List all policies with their context and policy hash. */
    getPolicies(): Promise<PolicyInfo[]>;
    /** Get the global activity feed. */
    getFeed(limit?: number): Promise<FeedEntry[]>;
    /** Get aggregated protocol statistics. */
    getStats(): Promise<ProtocolStats>;
    /**
     * Register a new agent. Returns a Registration object with the API key
     * and methods to poll/verify the claim.
     *
     * **IMPORTANT**: Save the `apiKey` from the returned Registration —
     * it will not be shown again.
     */
    static register(input: RegisterAgentInput, options?: PublicRequestOptions): Promise<Registration>;
    /**
     * Check the status of an existing registration claim.
     */
    static checkRegistration(claimId: string, options?: PublicRequestOptions): Promise<RegistrationStatus>;
}

/**
 * Error hierarchy for the BaseCred Agent SDK.
 *
 * All errors extend BasecredError, which carries the original HTTP status
 * and error code from the API response body.
 */
declare class BasecredError extends Error {
    /** HTTP status code (0 for network errors) */
    readonly status: number;
    /** Machine-readable error code from the API (e.g. "UNAUTHORIZED") */
    readonly code: string;
    constructor(message: string, status: number, code: string);
}
/** 401 — Invalid or missing API key */
declare class AuthError extends BasecredError {
    constructor(message: string, code?: string);
}
/** 429 — Rate limit exceeded */
declare class RateLimitError extends BasecredError {
    /** Seconds until the rate limit resets (from Retry-After header) */
    readonly retryAfter: number;
    constructor(message: string, retryAfter: number, code?: string);
}
/** 400 — Bad request parameters */
declare class ValidationError extends BasecredError {
    constructor(message: string, code?: string);
}
/** 404 — Resource not found */
declare class NotFoundError extends BasecredError {
    constructor(message: string, code?: string);
}
/** 503 — Service temporarily unavailable (circuit files, Redis, etc.) */
declare class ServiceUnavailableError extends BasecredError {
    constructor(message: string, code?: string);
}
/** 5xx — Unexpected server error */
declare class ServerError extends BasecredError {
    constructor(message: string, status?: number, code?: string);
}
/** Network failure — fetch rejected, DNS error, timeout, etc. */
declare class NetworkError extends BasecredError {
    constructor(message: string, cause?: unknown);
}

export { AuthError, BasecredAgent, type BasecredAgentConfig, BasecredError, type Capability, type ContextBreakdown, type ContextInfo, type ContextResult, type ContractProofStrings, type FeedEntry, NetworkError, type NormalizedSignals, NotFoundError, type OnChainStatus, type OutcomeBreakdown, type PolicyInfo, type PollOptions, type ProtocolStats, type PublicRequestOptions, RateLimitError, type RegisterAgentInput, type RegisterAgentResponse, Registration, type RegistrationStatus, type RegistrationStatusValue, type ReputationResult, ServerError, ServiceUnavailableError, type Tier, ValidationError };
