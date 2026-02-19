---
id: agent-sdk
title: Agent SDK
sidebar_label: Agent SDK
sidebar_position: 7
---

# Agent SDK

> Type-safe TypeScript client for the BaseCred Agent API.

The `@basecred/agent-sdk` package wraps the [Agent API](./agent-api) into a typed client with built-in error handling, registration polling, and ZK proof support.

## Installation

```bash
npm install @basecred/agent-sdk
```

## Quick Start

```typescript
import { BasecredAgent } from "@basecred/agent-sdk";

const agent = new BasecredAgent({ apiKey: "bc_your_api_key" });
const result = await agent.checkOwner();

console.log(result.summary);
// "Your reputation is strong across all contexts."
```

## Registration Flow

New agents must register and be verified by their owner before the API key becomes active.

### 1. Register

```typescript
import { BasecredAgent } from "@basecred/agent-sdk";

const registration = await BasecredAgent.register({
  agentName: "my_agent",
  telegramId: "@owner_tg",
  ownerAddress: "0x1234...abcd",
  webhookUrl: "https://example.com/webhook", // optional
});

// SAVE THIS — it will not be shown again
console.log(registration.apiKey);

// Send this URL to the owner
console.log(registration.claimUrl);
```

The returned `Registration` object contains:

| Property | Type | Description |
|---|---|---|
| `apiKey` | `string` | API key (save immediately, shown only once) |
| `claimId` | `string` | Unique claim identifier |
| `claimUrl` | `string` | URL the owner visits to verify |
| `verificationCode` | `string` | Code the owner includes in their tweet |

### 2. Poll for Verification

Use the async generator to watch for status changes:

```typescript
for await (const status of registration.poll()) {
  console.log(status.status); // "pending_claim" → "verified"
  if (status.status === "verified") break;
}
```

Or use the convenience method that resolves when verified:

```typescript
const verified = await registration.waitUntilVerified();
```

#### Poll Options

| Option | Type | Default | Description |
|---|---|---|---|
| `intervalMs` | `number` | `5000` | Milliseconds between polls |
| `maxAttempts` | `number` | `720` | Max polls (~1 hour at 5s) |
| `signal` | `AbortSignal` | — | Cancel polling |

### 3. Use the API Key

Once verified, create a client and start checking reputation:

```typescript
const agent = new BasecredAgent({ apiKey: registration.apiKey });
const result = await agent.checkOwner();
```

## API Methods

### Authenticated (requires API key)

| Method | Returns | Description |
|---|---|---|
| `checkOwner()` | `ReputationResult` | Check owner reputation across all contexts with ZK proofs and on-chain submission. Can take up to 90s. |

### Public (no auth, uses instance config)

| Method | Returns | Description |
|---|---|---|
| `getContexts()` | `ContextInfo[]` | List all available decision contexts |
| `getPolicies()` | `PolicyInfo[]` | List all policies with context and policy hash |
| `getFeed(limit?)` | `FeedEntry[]` | Get the global activity feed |
| `getStats()` | `ProtocolStats` | Get aggregated protocol statistics |

### Static (no API key required)

| Method | Returns | Description |
|---|---|---|
| `BasecredAgent.register(input, options?)` | `Registration` | Register a new agent |
| `BasecredAgent.checkRegistration(claimId, options?)` | `RegistrationStatus` | Check status of an existing registration |

## Configuration

```typescript
const agent = new BasecredAgent({
  apiKey: "bc_your_api_key",           // Required
  baseUrl: "https://www.zkbasecred.xyz", // Optional (default)
  timeoutMs: 120_000,                  // Optional (default: 120s)
  fetch: customFetch,                  // Optional (default: global fetch)
});
```

## Error Handling

All API errors are mapped to typed error classes extending `BasecredError`:

```typescript
import {
  BasecredAgent,
  AuthError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  ServerError,
  NetworkError,
} from "@basecred/agent-sdk";

try {
  const result = await agent.checkOwner();
} catch (error) {
  if (error instanceof AuthError) {
    // 401 — invalid or missing API key
  } else if (error instanceof RateLimitError) {
    // 429 — back off for error.retryAfter seconds
    console.log(`Retry after ${error.retryAfter}s`);
  } else if (error instanceof ServiceUnavailableError) {
    // 503 — ZK circuit files not available
  } else if (error instanceof NetworkError) {
    // DNS failure, timeout, etc.
  }
}
```

### Error Classes

| Class | HTTP Status | Description |
|---|---|---|
| `BasecredError` | — | Base class. All errors have `status`, `code`, `message`. |
| `AuthError` | 401 | Invalid or missing API key |
| `RateLimitError` | 429 | Rate limit exceeded. Has `retryAfter` (seconds). |
| `ValidationError` | 400 | Bad request parameters |
| `NotFoundError` | 404 | Resource not found |
| `ServiceUnavailableError` | 503 | Service temporarily unavailable |
| `ServerError` | 5xx | Unexpected server error |
| `NetworkError` | 0 | Network failure (DNS, timeout, etc.) |

## Key Types

| Type | Description |
|---|---|
| `BasecredAgentConfig` | Constructor config (`apiKey`, `baseUrl`, `timeoutMs`, `fetch`) |
| `PublicRequestOptions` | Options for static methods (`baseUrl`, `timeoutMs`, `fetch`) |
| `RegisterAgentInput` | Input for `register()` (`agentName`, `telegramId`, `ownerAddress`, `webhookUrl?`) |
| `Registration` | Returned by `register()`. Has `apiKey`, `claimId`, `poll()`, `waitUntilVerified()`. |
| `RegistrationStatus` | Poll result (`status`, `agentName`, `verificationCode?`, `expiresAt?`) |
| `RegistrationStatusValue` | `"pending_claim" \| "verified" \| "expired" \| "revoked"` |
| `ReputationResult` | Full check result (`ownerAddress`, `agentName`, `summary`, `signals`, `results`) |
| `ContextResult` | Per-context decision (`decision`, `confidence`, `constraints`, `proof?`, `onChain?`) |
| `NormalizedSignals` | Reputation signals (`trust`, `socialTrust`, `builder`, `creator`, `recencyDays`, `spamRisk`) |
| `FeedEntry` | Activity feed item (`agentName`, `ownerAddress`, `context`, `txHash?`, `timestamp`) |
| `PolicyInfo` | Policy details (`context`, `policyHash`, `normalizationVersion`) |
| `ProtocolStats` | Aggregated stats (`totalDecisions`, `uniqueAgents`, `decisionsByOutcome`, etc.) |
| `PollOptions` | Polling config (`intervalMs`, `maxAttempts`, `signal`) |

## Further Reading

- [Agent API Reference](./agent-api) — raw HTTP endpoints
- [SDK Reference](./sdk) — core decision engine SDK (`basecred-decision-engine`)
- [Response Schema](./schema) — canonical decision output format
