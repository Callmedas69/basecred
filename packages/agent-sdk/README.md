# @basecred/agent-sdk

Type-safe SDK for the [BaseCred](https://www.zkbasecred.xyz) reputation API. Zero dependencies — uses global `fetch` (Node 18+).

## Installation

```bash
npm install @basecred/agent-sdk
# or
pnpm add @basecred/agent-sdk
```

## Quick Start

### Check Owner Reputation (3 lines)

```typescript
import { BasecredAgent } from "@basecred/agent-sdk"

const agent = new BasecredAgent({ apiKey: "bc_..." })
const result = await agent.checkOwner()
console.log(result.summary)
// "Your reputation is strong. You have high trust on Ethos, ..."
```

### Full Registration Flow

```typescript
import { BasecredAgent } from "@basecred/agent-sdk"

// 1. Register your agent (no API key needed)
const registration = await BasecredAgent.register({
  agentName: "MyBot",
  telegramId: "@mybot",
  ownerAddress: "0x...",
})

// 2. SAVE THE API KEY — it will not be shown again
console.log("API Key:", registration.apiKey)
console.log("Send to owner:", registration.claimUrl)

// 3. Wait for owner verification (polls every 5s, up to 1 hour)
const status = await registration.waitUntilVerified()
console.log("Verified!", status)

// 4. Or submit the tweet URL programmatically
await registration.verify("https://x.com/user/status/123456789")
```

### Error Handling

```typescript
import { BasecredAgent, RateLimitError, AuthError } from "@basecred/agent-sdk"

try {
  const agent = new BasecredAgent({ apiKey: "bc_..." })
  const result = await agent.checkOwner()
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry in ${error.retryAfter}s`)
  } else if (error instanceof AuthError) {
    console.log("Invalid API key")
  }
}
```

### Public Endpoints (No Auth)

```typescript
const agent = new BasecredAgent({ apiKey: "bc_..." })

const contexts = await agent.getContexts()
const policies = await agent.getPolicies()
const feed = await agent.getFeed()
const stats = await agent.getStats()
```

## API Reference

### `new BasecredAgent(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | *required* | API key (starts with `bc_`) |
| `baseUrl` | `string` | `https://www.zkbasecred.xyz` | API base URL |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation |
| `timeoutMs` | `number` | `120000` | Request timeout in ms |

### Instance Methods

| Method | Auth | Description |
|--------|------|-------------|
| `checkOwner()` | Yes | Check owner's reputation (ZK proofs + on-chain) |
| `getContexts()` | No | List decision contexts |
| `getPolicies()` | No | List policies with hashes |
| `getFeed(limit?)` | No | Get global activity feed |
| `getStats()` | No | Get protocol statistics |

### Static Methods

| Method | Description |
|--------|-------------|
| `BasecredAgent.register(input, options?)` | Register a new agent |
| `BasecredAgent.checkRegistration(claimId, options?)` | Check registration status |

### `Registration`

Returned by `BasecredAgent.register()`.

| Property | Type | Description |
|----------|------|-------------|
| `apiKey` | `string` | The API key (save this!) |
| `claimId` | `string` | Claim ID for polling |
| `claimUrl` | `string` | URL for owner to verify |
| `verificationCode` | `string` | Code for the verification tweet |

| Method | Description |
|--------|-------------|
| `poll(options?)` | Async generator yielding status updates |
| `waitUntilVerified(options?)` | Resolves when verified, rejects on timeout/expire/revoke |
| `verify(tweetUrl)` | Submit tweet URL for verification |

### Error Classes

All errors extend `BasecredError`:

| Class | Status | When |
|-------|--------|------|
| `AuthError` | 401 | Invalid/missing API key |
| `RateLimitError` | 429 | Rate limit exceeded (has `retryAfter`) |
| `ValidationError` | 400 | Bad request parameters |
| `NotFoundError` | 404 | Resource not found |
| `ServiceUnavailableError` | 503 | Service temporarily down |
| `ServerError` | 5xx | Unexpected server error |
| `NetworkError` | — | Fetch failed, timeout |

## Runtime Requirements

- Node.js 18+ (uses global `fetch`)
- **Server-side only** — API keys are visible in browser DevTools. Use this SDK in server runtimes, background agents, or serverless functions.

## License

MIT
