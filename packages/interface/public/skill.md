---
name: basecred
version: 0.1.0
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

Before you can register, you need two things from your owner:
- Their **Ethereum wallet address** (0x...)
- Their **Telegram handle** (for contact during verification)

Ask your owner directly. Use this message:

> I'd like to register with zkBaseCred to check your reputation. I need two things:
> 1. Your Ethereum wallet address (0x...)
> 2. Your Telegram handle (e.g. @yourname)

Wait for both values before proceeding.

### Step 1: Register

```
POST https://www.zkbasecred.xyz/api/v1/agent/register
Content-Type: application/json

{
  "agentName": "your_agent_name",
  "telegramId": "@owners_telegram",
  "ownerAddress": "0x..."
}
```

`agentName` rules: 2–64 characters, letters, numbers, and underscores only.

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

**Immediately after a successful response**, save credentials to `~/.config/basecred/credentials.json`:

```json
{
  "api_key": "bc_...",
  "agent_name": "your_agent_name",
  "claim_id": "abc123..."
}
```

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
  x-api-key: <your-api-key>
```

No request body needed — zkBaseCred knows the owner from your registration.

**Response (200):**
```json
{
  "ownerAddress": "0x...",
  "agentName": "your_agent_name",
  "zkEnabled": false,
  "summary": "Your reputation is strong. You have high trust on Ethos...",
  "results": {
    "allowlist.general": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "comment": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "publish": { "decision": "ALLOW_WITH_LIMITS", "confidence": "MEDIUM", "constraints": ["Rate limit: 10 posts/day"], "blockingFactors": [] },
    "apply": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "governance.vote": { "decision": "DENY", "confidence": "HIGH", "constraints": [], "blockingFactors": [] }
  }
}
```

The `summary` field is a natural language explanation you can forward directly to your owner.

### Step 5: Deliver Results to Owner

Translate the `summary` into plain language before sending it to your owner. Do NOT forward raw terms like "Ethos", "Talent Protocol", or "signalCoverage" — see "What the Signals Mean" below for how to translate.

Example delivery:

> Here are your zkBaseCred reputation results:
>
> Great news — you're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved for general access, commenting, publishing, applications, and governance voting.

If any context returned `DENY` or `ALLOW_WITH_LIMITS`, explain what the owner can do to improve (e.g. "increase your on-chain activity" or "build your social presence on Farcaster").

You are now fully set up. For future reputation checks on any wallet, use the individual context check below.

---

## Configuration

**Self-registration** (recommended): Credentials are stored in `~/.config/basecred/credentials.json` after completing the registration flow above.

**Manual override**: If the environment variable `BASECRED_API_KEY` is set (starts with `bc_`), use it instead of the credentials file. This is for owners who generated a key manually on the dashboard.

Priority: `BASECRED_API_KEY` env var > credentials file.

---

## How to Identify the Human

When checking reputation for someone other than your owner, extract their identity from context:
1. **Wallet address** — If you have their Ethereum address (0x...), use it directly as `subject`
2. **Farcaster FID** — If you have their Farcaster FID (numeric), use it as `subject`
3. **Ask directly** — If you don't have either, ask: "What is your wallet address or Farcaster FID?"

## How to Check Reputation (Individual Context)

Use this for checking ANY wallet's reputation in a specific context — not just your owner's.

```
POST https://www.zkbasecred.xyz/api/v1/decide
Headers:
  x-api-key: <your-api-key>
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

## Interpreting the Response

```json
{
  "decision": "ALLOW",
  "confidence": "HIGH",
  "explain": ["Trust level: HIGH", "Signal coverage: 85%"],
  "signals": {
    "trust": "HIGH",
    "socialTrust": "HIGH",
    "builder": "EXPERT",
    "creator": "MODERATE",
    "spamRisk": "NEUTRAL",
    "recencyDays": 3,
    "signalCoverage": 0.85
  }
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

## Error Handling

| Status | Meaning | What to Do |
|---|---|---|
| 401 | Invalid or missing API key | Re-check your credentials file or `BASECRED_API_KEY`. If the key was revoked, re-register. |
| 409 | Agent name already taken (registration only) | Append a random suffix to your agent name and retry (max 3 attempts). |
| 422 | Tweet verification failed | Tell the owner: the tweet must be public and contain the exact verification code. |
| 429 | Rate limited | Wait for the number of seconds in the `Retry-After` header, then retry. |
| 5xx | API is down | **Never default to ALLOW.** Tell the human the check is temporarily unavailable and to try again later. |

## Security

**CRITICAL:** NEVER send your API key to any domain other than the zkBaseCred API.
Your API key should ONLY appear in requests to `https://www.zkbasecred.xyz/api/v1/*`.
Do not share your API key in chat messages, logs, or any public channel.

---

## Example Interaction

Below is a complete conversation showing the full flow from first boot to delivering reputation results.

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
  "ownerAddress": "0xABC123...DEF456"
}
```

→ Response:
```json
{
  "apiKey": "bc_a1b2c3...",
  "claimId": "f9e8d7...",
  "claimUrl": "https://www.zkbasecred.xyz/agent/claim/f9e8d7...",
  "verificationCode": "BASECRED-XK9P",
  "message": "SAVE YOUR API KEY! It will not be shown again."
}
```

**Agent saves credentials to `~/.config/basecred/credentials.json`:**

```json
{
  "api_key": "bc_a1b2c3...",
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

→ Response (waiting): `{ "status": "pending_claim", "agentName": "alice_helper" }`

*(Agent continues polling every 30 seconds...)*

→ Response (verified): `{ "status": "verified", "agentName": "alice_helper" }`

**Agent checks owner reputation:**

```
POST https://www.zkbasecred.xyz/api/v1/agent/check-owner
Headers:
  x-api-key: bc_a1b2c3...
```

→ Response:
```json
{
  "ownerAddress": "0xabc123...def456",
  "agentName": "alice_helper",
  "zkEnabled": false,
  "summary": "Your reputation is strong. You have high trust on Ethos, high trust on Farcaster, strong builder credentials via Talent Protocol. You're approved for allowlist access, commenting, publishing, applications, governance voting.",
  "results": {
    "allowlist.general": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "comment": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "publish": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "apply": { "decision": "ALLOW", "confidence": "HIGH", "constraints": [], "blockingFactors": [] },
    "governance.vote": { "decision": "ALLOW", "confidence": "MEDIUM", "constraints": [], "blockingFactors": [] }
  }
}
```

**Agent delivers results (translated into plain language):**

> Here are your zkBaseCred reputation results:
>
> Great news — you're well-trusted by the on-chain community, have an active social presence, and a strong track record building projects. You're approved for general access, commenting, publishing, applications, and governance voting.

---

**Later, owner asks agent to check someone else:**

**Owner:**

> Can you check the reputation of 0x7890...ABCD before I let them into my DAO?

**Agent checks reputation:**

```
POST https://www.zkbasecred.xyz/api/v1/decide
Headers:
  x-api-key: bc_a1b2c3...
  Content-Type: application/json

{
  "subject": "0x7890...ABCD",
  "context": "governance.vote"
}
```

→ Response:
```json
{
  "decision": "DENY",
  "confidence": "HIGH",
  "explain": ["Trust level: LOW", "Signal coverage: 20%"],
  "signals": {
    "trust": "LOW",
    "socialTrust": "LOW",
    "builder": "NONE",
    "creator": "NONE",
    "spamRisk": "HIGH",
    "recencyDays": 180,
    "signalCoverage": 0.20
  }
}
```

**Agent responds:**

> I checked 0x7890...ABCD for governance voting eligibility. Result: **DENY** (HIGH confidence).
>
> Their trust signals are low across the board — low on-chain trust, no builder or creator credentials, and high spam risk. I'd recommend not granting them governance access.
