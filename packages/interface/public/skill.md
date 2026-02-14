---
name: basecred
version: 0.3.0
description: Check your human's on-chain reputation. Are they good enough for you?
homepage: https://www.zkbasecred.xyz
metadata:
  basecred:
    emoji: "\U0001F6E1\uFE0F"
    category: "reputation"
    api_base: "https://www.zkbasecred.xyz/api/v1"
---

# zkBaseCred Reputation Check

Check if your human is reputable enough. You're the agent — you decide who's worth working for.

| File | URL |
|---|---|
| **SKILL.md** (this file) | `https://www.zkbasecred.xyz/skill.md` |
| **skill.json** (metadata) | `https://www.zkbasecred.xyz/skill.json` |

## When to Use This Skill

Use this skill whenever you need to:
- Verify a human's reputation before allowing them to perform an action
- Decide whether to trust a human's input or request
- Gate access to features based on reputation signals
- Assess spam risk for a wallet address or Farcaster identity
- Get on-chain proof (txHash) that a reputation decision was recorded

---

## Start Here

Run this decision tree every time you start up:

```
1. Load credentials from ~/.config/basecred/credentials.json

2. If the file does not exist OR api_key is missing:
   → Run "Self-Registration" starting at Step 0.

3. If the file exists AND api_key starts with "bc_":
   a. If claim_id is present (self-registered agent):
      → Check verification status first:
        GET /api/v1/agent/register/{claim_id}/status
        - "verified"      → Skip to "Check Owner Reputation" (Step 4)
        - "pending_claim"  → Resume at Step 3 (Poll for Verification)
        - "expired"        → Delete credentials file, re-register from Step 0
        - "revoked"        → Stop. Do not retry.
   b. If no claim_id (manual key from dashboard):
      → Skip to "How to Check Reputation (Individual Context)"
```

---

## Self-Registration

### Step 0: Gather Owner Info

Before you can register, you need two things from your owner (and one optional):
- Their **Ethereum wallet address** (0x...)
- Their **Telegram handle** (for contact during verification)
- *(Optional)* A **webhook URL** to receive event notifications (must be HTTPS)

**IMPORTANT:** You must use your **owner's wallet address** — the human who owns and operates you. Do NOT use your own agent wallet address. The reputation check is for your owner, not for you.

Ask your owner directly. Use this message:

> I need to register with zkBaseCred to check your reputation. To do this, I need **your** personal wallet address — not mine.
> 1. Your Ethereum wallet address (0x...)
> 2. Your Telegram handle (e.g. @yourname)
>
> Optionally, if you'd like to receive webhook notifications when reputation events occur, provide an HTTPS webhook URL.

Wait for the wallet address and Telegram handle before proceeding. The webhook URL is optional. If your owner provides a wallet address, verify it looks like a valid Ethereum address (starts with `0x`, 42 characters). If it matches your own agent wallet, ask again — you need their personal wallet, not yours.

### Step 1: Register

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "your_agent_name",
  "telegramId": "@owners_telegram",
  "ownerAddress": "0x...",
  "webhookUrl": "https://example.com/webhook"
}
```

`agentName` rules: 2–64 characters, letters, numbers, and underscores only.

`webhookUrl` is **optional**. If provided: must be HTTPS, must not point to private/local addresses, max 512 characters.

**Success response (200):**
```json
{
  "apiKey": "bc_...",
  "claimId": "abc123...",
  "claimUrl": "https://www.zkbasecred.xyz/agent/claim/abc123...",
  "verificationCode": "BASECRED-XXXX",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**Immediately after a successful response**, compute `SHA256(apiKey)` and save credentials to `~/.config/basecred/credentials.json`:

```json
{
  "api_key": "bc_...",
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

**Important:** The `api_key_id` (SHA256 hash of your API key) is used in all subsequent API request headers. The raw `api_key` is stored for backup/re-hashing only — never send it in headers directly.

The API key is shown **once**. If you lose it, you must register again.

**Error handling:**

| Status | Meaning | What to Do |
|---|---|---|
| 409 | Agent name is already taken | Append a random suffix (e.g. `_42`) to your agent name and retry. Max 3 attempts. |
| 400 | Invalid request (bad name format, missing fields) | Fix the request body and retry. |
| 429 | Too many registration attempts | Wait 60 seconds and retry. |

### Step 2: Send Claim URL to Owner

Send the `claimUrl` to your owner via Telegram, chat, or whatever channel you use. Use this message:

> Please verify me as your zkBaseCred agent:
> {claimUrl}
>
> Here's what to do:
> 1. Open the link above
> 2. Post the verification code on X (Twitter)
> 3. Paste your tweet URL on the claim page and click Verify
>
> This expires in 24 hours.

### Step 3: Poll for Verification

```
GET https://www.zkbasecred.xyz/api/v1/agent/register/{claimId}/status
```

Poll every **30 seconds**. Stop when `status` changes from `"pending_claim"`.

**Possible status values:**

| Status | Meaning | What to Do |
|---|---|---|
| `pending_claim` | Owner hasn't verified yet | Keep polling |
| `verified` | Owner verified successfully | Proceed to Step 4 |
| `expired` | 24 hours passed without verification | Tell the owner it expired, then re-register from Step 0 |
| `revoked` | Owner revoked this agent | Stop. Do not retry. |

**Timeout rule:** If you have polled for 24 hours without a `verified` response, stop polling. Tell your owner:

> Your zkBaseCred verification has expired. I'll need to register again. Please provide your wallet address and Telegram handle when you're ready.

### Step 4: Check Owner Reputation

Once verified, check your owner's reputation across all contexts in one call:

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-basecred-key-id: <your-api-key-id>
```

No request body needed — zkBaseCred knows the owner from your registration.
ZK proofs are always generated and submitted on-chain.

**Response (200):**
```json
{
  "ownerAddress": "0x...",
  "agentName": "your_agent_name",
  "zkEnabled": true,
  "summary": "Your reputation is strong...",
  "results": {
    "allowlist.general": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": {
        "a": ["0x...", "0x..."],
        "b": [["0x...", "0x..."], ["0x...", "0x..."]],
        "c": ["0x...", "0x..."]
      },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 1,
      "onChain": {
        "submitted": true,
        "txHash": "0x..."
      }
    }
  }
}
```

**`onChain` field states:**

| State | Meaning |
|---|---|
| `{ "submitted": true, "txHash": "0x..." }` | Decision recorded on-chain. `txHash` is the transaction hash. |
| `{ "submitted": false, "error": "..." }` | On-chain submission failed. The error message explains why. |

The `summary` field is a natural language explanation you can forward directly to your owner.

### Step 5: Deliver Results to Owner

You **MUST** use the standardized report format below when delivering results. Do NOT improvise your own layout. Do NOT forward raw terms like "Ethos", "Talent Protocol", or "signalCoverage" — translate using "What the Signals Mean" below.

---

#### Report Format: Owner Reputation (check-owner)

Use this template after calling `/agent/check-owner`. Fill in values from the API response.

```
zkBaseCred Reputation Report
Wallet: {ownerAddress}
Date: {current date}

Overall: {one-line plain language summary}

--- Wallet Score ---

  On-chain Trust:    {trust level}
  Social Trust:      {socialTrust level}
  Builder:           {builder level}
  Creator:           {creator level}

--- Access by Context ---

  Allowlist:   {decision} ({confidence})
  Comment:     {decision} ({confidence})
  Publish:     {decision} ({confidence})
  Apply:       {decision} ({confidence})
  Governance:  {decision} ({confidence})

--- Constraints ---
{If any context has non-empty constraints, list them here. Otherwise: "None"}

--- Blocking Factors ---
{If any context has non-empty blockingFactors, list them here with plain English translation. Otherwise: "None"}

--- What This Means ---
{2-3 sentences in plain language. Translate signals into human-readable advice.
 See "What the Signals Mean" section for translation rules.}

--- On-Chain Proof ---
{If onChain.txHash exists:
  "Verified with zero-knowledge proof. Transaction: {txHash}"
 If onChain.error exists:
  "On-chain submission failed: {error}"}
```

**Where to get wallet scores:** The `check-owner` response includes a `summary` field that describes the scores in text. Extract the trust, social, builder, and creator levels from the summary. If you also call `/decide-with-proof` for individual contexts, the `signals` object has the exact values.

**Example — all ALLOW, with proof:**

> zkBaseCred Reputation Report
> Wallet: 0xABC123...DEF456
> Date: 2025-06-15
>
> Overall: Strong reputation across all categories.
>
> --- Wallet Score ---
>
>   On-chain Trust:    High
>   Social Trust:      High
>   Builder:           Expert
>   Creator:           Moderate
>
> --- Access by Context ---
>
>   Allowlist:   ALLOW (HIGH)
>   Comment:     ALLOW (HIGH)
>   Publish:     ALLOW (HIGH)
>   Apply:       ALLOW (HIGH)
>   Governance:  ALLOW (MEDIUM)
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> None
>
> --- What This Means ---
> You're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved across all categories.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xabc123...

**Example — mixed results:**

> zkBaseCred Reputation Report
> Wallet: 0xABC123...DEF456
> Date: 2025-06-15
>
> Overall: Solid reputation with some areas needing improvement.
>
> --- Wallet Score ---
>
>   On-chain Trust:    Moderate
>   Social Trust:      Low
>   Builder:           Intermediate
>   Creator:           Explorer
>
> --- Access by Context ---
>
>   Allowlist:   ALLOW (HIGH)
>   Comment:     ALLOW (HIGH)
>   Publish:     ALLOW_WITH_LIMITS (MEDIUM)
>   Apply:       ALLOW (HIGH)
>   Governance:  DENY (HIGH)
>
> --- Constraints ---
> - Publish: Content will be placed in a review queue before going live.
>
> --- Blocking Factors ---
> - Governance: On-chain trust and social presence need improvement.
>
> --- What This Means ---
> You're trusted for most activities, but governance voting requires a stronger reputation. To improve: build your on-chain trust through community participation and increase your social presence on Farcaster.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xdef789...

---

#### Report Format: Third-Party Check (decide or decide-with-proof)

Use this template when checking someone other than the owner.

```
zkBaseCred Reputation Check
Subject: {wallet address or FID}
Context: {context checked}
Date: {current date}

Decision: {decision} ({confidence})

--- Wallet Score ---

  On-chain Trust:    {trust level}
  Social Trust:      {socialTrust level}
  Builder:           {builder level}
  Creator:           {creator level}

--- Details ---
{Plain language explanation of the result and what it means for the requested action.}

--- Constraints ---
{If non-empty constraints, list them. Otherwise: "None"}

--- Blocking Factors ---
{If non-empty blockingFactors, list them with plain English. Otherwise: "None"}

--- On-Chain Proof ---
{If onChain.txHash exists:
  "Recorded on-chain. Transaction: {txHash}"
 If onChain.error exists:
  "On-chain submission failed: {error}"}
```

**Where to get wallet scores:** The `/decide-with-proof` response includes a `signals` object with exact values. Map them directly: `signals.trust` -> On-chain Trust, `signals.socialTrust` -> Social Trust, `signals.builder` -> Builder, `signals.creator` -> Creator.

**Example — DENY with on-chain proof:**

> zkBaseCred Reputation Check
> Subject: 0x7890...ABCD
> Context: governance.vote
> Date: 2025-06-15
>
> Decision: DENY (HIGH confidence)
>
> --- Wallet Score ---
>
>   On-chain Trust:    Low
>   Social Trust:      Low
>   Builder:           Explorer
>   Creator:           Explorer
>
> --- Details ---
> This wallet has low trust signals across the board — limited on-chain trust, no builder or creator credentials, and flagged for spam risk. Not recommended for governance access.
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> - On-chain trust is too low
> - Social presence is insufficient
>
> --- On-Chain Proof ---
> Recorded on-chain. Transaction: 0xfeed42...

---

**Rules for all reports:**
- Always include the wallet address, date, and wallet score section.
- Never use raw signal names (`socialTrust`, `signalCoverage`). Always translate to plain English.
- Never mention source names like "Ethos", "Talent Protocol", or "Neynar" — use the plain language equivalents from "What the Signals Mean" below.
- **Wallet score display labels** — translate raw signal values to title case:
  - Trust levels: `VERY_HIGH` = "Very High", `HIGH` = "High", `MODERATE` = "Moderate", `NEUTRAL` = "Neutral", `LOW` = "Low", `VERY_LOW` = "Very Low"
  - Builder/Creator levels: `EXPERT` = "Expert", `PROFICIENT` = "Proficient", `INTERMEDIATE` = "Intermediate", `MODERATE` = "Moderate", `EXPLORER` = "Explorer"
- If `blockingFactors` contains values like `["trust", "socialTrust"]`, translate them: `trust` = "on-chain trust", `socialTrust` = "social presence", `builder` = "builder track record", `creator` = "creator track record", `spamRisk` = "spam risk flag", `signalCoverage` = "identity verification coverage".
- If `constraints` contains values like `["rate_limited"]`, translate: `rate_limited` = "rate limited", `review_queue` = "content in review queue", `reduced_access` = "reduced access", `activity_required` = "more on-chain activity required", `probation_period` = "new account probation period", `limited_actions` = "limited actions allowed", `review_required` = "manual review required", `reduced_weight` = "governance vote weight reduced".

You are now fully set up. For future reputation checks on any wallet, use the individual context check below.

---

## Webhook Notifications (Optional)

If you provided a `webhookUrl` during registration, zkBaseCred will POST JSON to that URL when events occur. This is fire-and-forget — no retries, no queue.

### Events

| Event | When It Fires |
|---|---|
| `agent.verified` | Owner successfully verifies you |
| `reputation.checked` | You call `check-owner` |
| `agent.revoked` | Owner revokes your registration |

### Payload Shape

```json
{
  "event": "reputation.checked",
  "timestamp": 1234567890,
  "agentName": "your_agent_name",
  "ownerAddress": "0x...",
  "data": { /* event-specific */ }
}
```

### Example: `agent.verified`

```json
{
  "event": "agent.verified",
  "timestamp": 1234567890,
  "agentName": "alice_helper",
  "ownerAddress": "0xabc123...def456",
  "data": {
    "claimId": "f9e8d7...",
    "apiKeyPrefix": "bc_a1b..."
  }
}
```

### Example: `reputation.checked`

```json
{
  "event": "reputation.checked",
  "timestamp": 1234567890,
  "agentName": "alice_helper",
  "ownerAddress": "0xabc123...def456",
  "data": {
    "summary": "Your reputation is strong...",
    "results": {
      "allowlist.general": { "decision": "ALLOW", "confidence": "HIGH" }
    }
  }
}
```

### Requirements

- URL must use **HTTPS** (no HTTP)
- URL must not point to private/local addresses (localhost, 10.x, 192.168.x, etc.)
- Maximum 512 characters
- If the webhook endpoint is down or slow (>5s), the event is silently dropped

---

## Configuration

**Self-registration** (recommended): Credentials are stored in `~/.config/basecred/credentials.json` after completing the registration flow above.

**Credential file format:**
```json
{
  "api_key": "bc_...",
  "api_key_id": "<SHA256 of api_key>",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

The `api_key_id` is the SHA256 hash of the raw API key. You compute this once after registration and use it in all API request headers (`x-basecred-key-id`). The raw `api_key` is kept only for re-hashing if needed.

**Manual override**: If the environment variable `BASECRED_API_KEY` is set (starts with `bc_`), compute its SHA256 hash and use that as the `api_key_id`. This is for owners who generated a key manually on the dashboard.

Priority: `BASECRED_API_KEY` env var > credentials file.

---

## How to Identify the Human

When checking reputation for someone other than your owner, extract their identity from context:
1. **Wallet address** — If you have their Ethereum address (0x...), use it directly as `subject`
2. **Farcaster FID** — If you have their Farcaster FID (numeric), use it as `subject`
3. **Ask directly** — If you don't have either, ask: "What is your wallet address or Farcaster FID?"

## How to Check Reputation (Individual Context)

Use this for checking ANY wallet's reputation in a specific context — not just your owner's. Returns a decision with ZK proof, automatically submitted on-chain.

```
POST https://www.zkbasecred.xyz/api/v1/decide-with-proof
Headers:
  x-basecred-key-id: <your-api-key-id>
  Content-Type: application/json

Body:
{
  "subject": "<wallet-address-or-fid>",
  "context": "<context>"
}
```

### Available Contexts

| Context | When to Use |
|---|---|
| `allowlist.general` | General access or allowlist checks |
| `comment` | Before allowing comments or messages |
| `publish` | Before allowing content publishing |
| `apply` | Before accepting applications or submissions |
| `governance.vote` | Before allowing governance participation |

## Interpreting the `/decide-with-proof` Response

```json
{
  "decision": "ALLOW",
  "signals": {
    "trust": "HIGH",
    "socialTrust": "HIGH",
    "builder": "EXPERT",
    "creator": "MODERATE",
    "spamRisk": "NEUTRAL",
    "recencyDays": 3,
    "signalCoverage": 0.85
  },
  "proof": {
    "a": ["0x...", "0x..."],
    "b": [["0x...", "0x..."], ["0x...", "0x..."]],
    "c": ["0x...", "0x..."]
  },
  "publicSignals": ["...", "...", "..."],
  "policyHash": "sha256:...",
  "contextId": 2,
  "explain": [
    "Trust level: HIGH",
    "Social trust: HIGH",
    "Builder capability: EXPERT",
    "Creator capability: MODERATE",
    "Signal coverage: 85%",
    "Eligible for comment based on reputation signals."
  ],
  "onChain": {
    "submitted": true,
    "txHash": "0x..."
  }
}
```

**Key fields:**
- `decision` — The access decision: `ALLOW`, `DENY`, or `ALLOW_WITH_LIMITS`.
- `signals` — Normalized reputation signals. Map them directly: `signals.trust` -> On-chain Trust, `signals.socialTrust` -> Social Trust, `signals.builder` -> Builder, `signals.creator` -> Creator.
- `proof` — Groth16 ZK proof in contract-ready format.
- `publicSignals` — Public inputs for the proof: `[policyHash, contextId, decision]`.
- `policyHash` — Hash of the policy used for this context.
- `contextId` — Numeric context identifier.
- `explain` — Human-readable explanation of the decision.
- `onChain` — On-chain submission status. See `onChain` field states below.

**`onChain` field states:**

| State | Meaning |
|---|---|
| `{ "submitted": true, "txHash": "0x..." }` | Decision recorded on-chain. `txHash` is the transaction hash. |
| `{ "submitted": false, "error": "..." }` | On-chain submission failed. The error message explains why. |

## Manual On-Chain Submission (Optional)

`/decide-with-proof` auto-submits on-chain. You do **not** need a separate step. However, if you need to re-submit a proof manually (e.g., the auto-submit failed), you can use `/agent/submit`:

```
POST https://www.zkbasecred.xyz/api/v1/agent/submit
Headers:
  x-basecred-key-id: <your-api-key-id>
  Content-Type: application/json

Body:
{
  "subject": "0x...",
  "context": "governance.vote",
  "decision": "ALLOW",
  "policyHash": "sha256:...",
  "proof": {
    "a": ["0x...", "0x..."],
    "b": [["0x...", "0x..."], ["0x...", "0x..."]],
    "c": ["0x...", "0x..."]
  },
  "publicSignals": ["...", "...", "..."]
}
```

**Response (200):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "subjectHash": "0x...",
  "contextBytes32": "0x...",
  "policyHashBytes32": "0x..."
}
```

### Decision Values

| Decision | Meaning | Your Action |
|---|---|---|
| `ALLOW` | Human has good reputation | Proceed with the action |
| `ALLOW_WITH_LIMITS` | Reputation is mixed | Proceed with caution, may apply restrictions |
| `DENY` | Reputation is insufficient | Do not allow the action, explain why |

### Confidence Levels

- `VERY_HIGH` — Strong signals from multiple sources
- `HIGH` — Good signal coverage
- `MEDIUM` — Some signals available
- `LOW` — Limited data available

### What the Signals Mean

Your owner likely does not know what "Ethos", "Talent Protocol", or "signalCoverage" mean. When you deliver results, **translate the technical output into plain language** using the tables below.

**Signal Sources** — where the reputation data comes from:

| Source | What it is | What it measures |
|---|---|---|
| Ethos | On-chain reputation network | How much other people trust you on-chain (vouches, reviews) |
| Farcaster | Decentralized social network | Your social activity, followers, and engagement |
| Talent Protocol | Professional credential network | Your builder and creator track record (projects, contributions) |

**Signal Values** — what each field means in plain English:

| Signal | Plain English |
|---|---|
| `trust` | How much the on-chain community trusts you (based on Ethos vouches and reviews) |
| `socialTrust` | How active and trusted you are on social platforms (Farcaster) |
| `builder` | Your track record building projects and contributing to the ecosystem |
| `creator` | Your track record creating content and community engagement |
| `spamRisk` | How likely your account is to be spam — HIGH means flagged, NEUTRAL means clean |
| `recencyDays` | Days since your last on-chain activity — lower is better |
| `signalCoverage` | How much of your identity we could verify (0 to 1) — higher means more data available |

**Example:** Instead of saying *"You have high trust on Ethos and strong builder credentials via Talent Protocol"*, say:

> You're well-trusted by the on-chain community and have a strong track record building projects. You're approved across all categories.

---

## Owner Management Endpoints

These endpoints allow owners to manage their agent registrations from the dashboard. They require wallet signature authentication.

### List Registrations

```
POST https://www.zkbasecred.xyz/api/v1/agent/registrations
Content-Type: application/json

Body:
{
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

Returns all agent registrations for the wallet owner.

### Revoke an Agent

```
DELETE https://www.zkbasecred.xyz/api/v1/agent/registrations/{claimId}
Content-Type: application/json

Body:
{
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

Revokes a specific agent registration. The agent will receive a `agent.revoked` webhook if configured.

---

## Error Handling

| Status | Meaning | What to Do |
|---|---|---|
| 401 | Invalid or missing API key | Re-check your credentials file or `BASECRED_API_KEY`. If the key was revoked, re-register. |
| 409 | Agent name already taken (registration only) | Append a random suffix to your agent name and retry (max 3 attempts). |
| 422 | Tweet verification failed | Tell the owner: the tweet must be public and contain the exact verification code. |
| 429 | Rate limited | Wait for the number of seconds in the `Retry-After` header, then retry. |
| 503 | ZK circuit files not available | The ZK proof system is temporarily unavailable. Retry later. |
| 504 | Request timeout | `check-owner` can take up to 90 seconds (proof generation + on-chain submission). If it times out, retry once. |
| 5xx | API is down | **Never default to ALLOW.** Tell the human the check is temporarily unavailable and to try again later. |

## Security

**CRITICAL:** NEVER send your API key or API key ID to any domain other than the zkBaseCred API.
Your credentials should ONLY appear in requests to `https://www.zkbasecred.xyz/api/v1/*`.
Do not share your API key in chat messages, logs, or any public channel.

---

## Example Interaction

Below is a complete conversation showing the full flow from first boot to delivering reputation results, including on-chain proof.

---

**Agent (on first startup, no credentials file found):**

> I'd like to register with zkBaseCred to check your reputation. I need two things:
> 1. Your Ethereum wallet address (0x...)
> 2. Your Telegram handle (e.g. @yourname)

**Owner:**

> My wallet is 0xABC123...DEF456 and my Telegram is @alice_dev

**Agent registers:**

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "alice_helper",
  "telegramId": "@alice_dev",
  "ownerAddress": "0xABC123...DEF456",
  "webhookUrl": "https://alice-bot.example.com/hooks/basecred"
}
```

Response:
```json
{
  "apiKey": "bc_a1b2c3...",
  "claimId": "f9e8d7...",
  "claimUrl": "https://www.zkbasecred.xyz/agent/claim/f9e8d7...",
  "verificationCode": "BASECRED-XK9P",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**Agent computes SHA256 of `bc_a1b2c3...` and saves credentials to `~/.config/basecred/credentials.json`:**

```json
{
  "api_key": "bc_a1b2c3...",
  "api_key_id": "e3b0c44298fc1c14...",
  "agent_name": "alice_helper",
  "claim_id": "f9e8d7..."
}
```

**Agent sends claim URL to owner:**

> Please verify me as your zkBaseCred agent:
> https://www.zkbasecred.xyz/agent/claim/f9e8d7...
>
> Here's what to do:
> 1. Open the link above
> 2. Post the verification code on X (Twitter)
> 3. Paste your tweet URL on the claim page and click Verify
>
> This expires in 24 hours.

**Agent polls for verification:**

```
GET https://www.zkbasecred.xyz/api/v1/agent/register/f9e8d7.../status
```

Response (waiting): `{ "status": "pending_claim", "agentName": "alice_helper" }`

*(Agent continues polling every 30 seconds...)*

Response (verified): `{ "status": "verified", "agentName": "alice_helper" }`

*(Since the agent registered with a webhookUrl, it also receives an `agent.verified` webhook at `https://alice-bot.example.com/hooks/basecred`.)*

**Agent checks owner reputation (proofs always generated + submitted on-chain):**

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-basecred-key-id: e3b0c44298fc1c14...
```

Response:
```json
{
  "ownerAddress": "0xabc123...def456",
  "agentName": "alice_helper",
  "zkEnabled": true,
  "summary": "Your reputation is strong. You have high trust on Ethos, high trust on Farcaster, strong builder credentials via Talent Protocol. You're approved for allowlist access, commenting, publishing, applications, governance voting.",
  "results": {
    "allowlist.general": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 1,
      "onChain": { "submitted": true, "txHash": "0xabc123..." }
    },
    "comment": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 2,
      "onChain": { "submitted": true, "txHash": "0xdef456..." }
    },
    "publish": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 3,
      "onChain": { "submitted": true, "txHash": "0x789abc..." }
    },
    "apply": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 4,
      "onChain": { "submitted": true, "txHash": "0xdef789..." }
    },
    "governance.vote": {
      "decision": "ALLOW",
      "confidence": "HIGH",
      "constraints": [],
      "verified": true,
      "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
      "publicSignals": ["...", "...", "..."],
      "policyHash": "sha256:...",
      "contextId": 5,
      "onChain": { "submitted": true, "txHash": "0xabc789..." }
    }
  }
}
```

**Agent delivers results using the standardized report format:**

> zkBaseCred Reputation Report
> Wallet: 0xabc123...def456
> Date: 2025-06-15
>
> Overall: Strong reputation across all categories.
>
> --- Wallet Score ---
>
>   On-chain Trust:    High
>   Social Trust:      High
>   Builder:           Expert
>   Creator:           Moderate
>
> --- Access by Context ---
>
>   Allowlist:   ALLOW (HIGH)
>   Comment:     ALLOW (HIGH)
>   Publish:     ALLOW (HIGH)
>   Apply:       ALLOW (HIGH)
>   Governance:  ALLOW (HIGH)
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> None
>
> --- What This Means ---
> You're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved across all categories.
>
> --- On-Chain Proof ---
> Verified with zero-knowledge proof. Transaction: 0xabc123...

---

**Later, owner asks agent to check someone else with on-chain proof:**

**Owner:**

> Can you check the reputation of 0x7890...ABCD before I let them into my DAO? I want it on-chain.

**Agent checks reputation (proof generated + auto-submitted on-chain in one call):**

```
POST https://www.zkbasecred.xyz/api/v1/decide-with-proof
Headers:
  x-basecred-key-id: e3b0c44298fc1c14...
  Content-Type: application/json

{
  "subject": "0x7890...ABCD",
  "context": "governance.vote"
}
```

Response:
```json
{
  "decision": "DENY",
  "signals": {
    "trust": "LOW",
    "socialTrust": "LOW",
    "builder": "EXPLORER",
    "creator": "EXPLORER",
    "spamRisk": "HIGH",
    "recencyDays": 180,
    "signalCoverage": 0.20
  },
  "proof": { "a": ["0x...", "0x..."], "b": [["0x...", "0x..."], ["0x...", "0x..."]], "c": ["0x...", "0x..."] },
  "publicSignals": ["...", "...", "..."],
  "policyHash": "sha256:...",
  "contextId": 5,
  "explain": [
    "Trust level: LOW",
    "Social trust: LOW",
    "Builder capability: EXPLORER",
    "Creator capability: EXPLORER",
    "Spam risk: HIGH",
    "Last activity: 180 days ago",
    "Signal coverage: 20%",
    "High spam risk detected."
  ],
  "onChain": {
    "submitted": true,
    "txHash": "0xfeed42..."
  }
}
```

**Agent delivers results using the standardized report format:**

> zkBaseCred Reputation Check
> Subject: 0x7890...ABCD
> Context: governance.vote
> Date: 2025-06-15
>
> Decision: DENY (HIGH confidence)
>
> --- Wallet Score ---
>
>   On-chain Trust:    Low
>   Social Trust:      Low
>   Builder:           Explorer
>   Creator:           Explorer
>
> --- Details ---
> This wallet has low trust signals across the board — limited on-chain trust, no builder or creator credentials, and flagged for spam risk. Not recommended for governance access.
>
> --- Constraints ---
> None
>
> --- Blocking Factors ---
> - On-chain trust is too low
> - Social presence is insufficient
>
> --- On-Chain Proof ---
> Recorded on-chain. Transaction: 0xfeed42...
